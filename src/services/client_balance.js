const axios = require("axios");

// Valida si el cliente existe en la base de datos
const validate_client = async (document_id) => {
  try {
    const url_to_consult = `https://zoho.accsolutions.tech/API/v1/Clientes_Report?where=Documento=="${document_id}"`;
    const client = await axios.get(url_to_consult);
    return {
      code: client.data.data[0] ? 200 : 400,
      data: client.data.data[0],
    };
  } catch (error) {
    return {
      code: 400,
      data: [],
    };
  }
};

// Consult client balance
const consult_balance = async (idClient) => {
  try {
    const urlFindBalance = `https://zoho.accsolutions.tech/API/v1/Remision_Report?where=Cliente.Documento=="${idClient}"&&Saldo>0`;
    const findBalanceCustomer = await axios.get(urlFindBalance);
    if (findBalanceCustomer.data.status === 400) {
      return {
        code: 400,
      };
    } else {
        client_name = findBalanceCustomer.data.data[0].Cliente.zc_display_value.split('-')[0].trim();
      return {
        code: 200,
        Saldo: sumarSaldo(findBalanceCustomer.data.data),
        name: client_name
      };
    }
  } catch (error) {
    return {
      code: 400,
    };
  }
};

// Sum array balance
const sumarSaldo = (array) => {
  var sumaTotal = array.reduce((acumulador, currencyObject) => {
    return acumulador + parseFloat(currencyObject.Saldo);
  }, 0);

  return sumaTotal;
};

module.exports = { validate_client, consult_balance };
