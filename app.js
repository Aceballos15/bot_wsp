const {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
} = require("@bot-whatsapp/bot");

const QRPortalWeb = require("@bot-whatsapp/portal");
const BaileysProvider = require("@bot-whatsapp/provider/baileys");
const MockAdapter = require("@bot-whatsapp/database/mock");
const allowedOptions = ["1", "2"]; // Asegúrate de que las opciones sean cadenas de texto

//Client validations
const {
  validate_client,
  consult_balance,
} = require("./src/services/client_balance");

// Const flow subir abonos
const abono = addKeyword("CLIENT ABONO").addAnswer("Servicio en desarrollo...");

// Const flow ask_cedula
const flowIdentification = addKeyword("CONSULT BALANCE").addAnswer(
  "Por favor ingresa tu número de documento sin puntos, espacios y/o dígitos de verificación",
  { capture: true },
  async (ctx, { flowDynamic, fallBack }) => {
    const identification = ctx.body.trim();
    const response_validate = await validate_client(identification);
    if (response_validate.code == 200) {
      await flowDynamic("Consultando...");
      const clientDetails = await consult_balance(identification);
      if (clientDetails.code == 200) {
        const saldoFormatted = clientDetails.Saldo.toLocaleString("es-CO", {
          style: "currency",
          currency: "COP",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
        const client_name = clientDetails.name
          .toLowerCase()
          .split(" ")
          .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
          .join(" ");

        messageSend = `Señor/a *${client_name}*\nUsted tiene un saldo pendiente de *${saldoFormatted}*`;
        await flowDynamic(messageSend);
      } else {
        await flowDynamic(
          "Usted no tiene saldos pendientes actualmente con TecnoSuper"
        );
      }
    } else {
      await flowDynamic(
        "El número de cédula no es correcto o no se encuentra registrado en la base de datos. Por favor ingrese el número de identificación nuevamente"
      );
      return fallBack();
    }
  }
);

const flowPrincipal = addKeyword(["hola", "Hola", "ola"], { sensitive: true })
  .addAnswer(
    "¡Hola! 👋 Bienvenido al servicio automático para nuestros clientes y usuarios TecnoSuper. ¿Qué deseas hacer hoy?"
  )
  .addAnswer(
    "*1.* Consultar saldo",
    { capture: true },
    async (ctx, { fallBack, flowDynamic, gotoFlow }) => {
      const option = ctx.body.trim();
      // Validar que la opción sea correcta
      if (!allowedOptions.includes(option)) {
        await flowDynamic("Por favor seleccione una opción valida");
        return fallBack();
      } else {
        //Validate clients
        switch (option) {
          case "1":
            try {
              return gotoFlow(flowIdentification);
            } catch (error) {
              console.log(error);
              await flowDynamic(
                "Ha ocurrido un error, por favor intente nuevamente"
              );
              return fallBack();
            }

            break;
          case "2":
            return gotoFlow(abono);
            break;
        }
      }
    }
  );

const main = async () => {
  const adapterDB = new MockAdapter();
  const adapterFlow = createFlow([flowPrincipal, flowIdentification, abono]);
  const adapterProvider = createProvider(BaileysProvider);

  createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });

  QRPortalWeb();
};

main();
