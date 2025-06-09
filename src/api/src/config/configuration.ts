export default () => ({
  PORT: process.env.PORT,
  DB_CONN_STRING: process.env.DB_CONN_STRING,
  DB_NAME: process.env.DB_NAME,
  API_ENDPOINT: process.env.API_ENDPOINT,
  STORE_ENDPOINT: process.env.STORE_ENDPOINT,
  MENU_ENDPOINT: process.env.MENU_ENDPOINT,
  SUPERTOKENS_CONNECTION_URI: process.env.SUPERTOKENS_CONNECTION_URI,
})
