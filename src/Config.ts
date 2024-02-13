const { REACT_APP_API_ENV, REACT_APP_APP_ENV } = process.env
const apiEnv = REACT_APP_API_ENV!.toUpperCase()
const appEnv = REACT_APP_APP_ENV!.toUpperCase()

const config = {
    devApp: REACT_APP_APP_ENV === 'dev',
    apiURL: process.env[`REACT_APP_${apiEnv}_API_URL`],
    apiWebSocketURL: process.env[`REACT_APP_${apiEnv}_WEBSOCKET_API_URL`],
    appURL: process.env[`REACT_APP_${appEnv}_APP_URL`],
    recaptchaSiteKey: process.env[`REACT_APP_RECAPTCHA_SITE_KEY_${apiEnv}`],
    vapidPublicKey: process.env[`REACT_APP_${apiEnv}_VAPID_PUBLIC_KEY`],
    turnServerUrl: process.env.REACT_APP_TURN_SERVER_URL,
    turnServerUsername: process.env.REACT_APP_TURN_SERVER_USERNAME,
    turnServerPassword: process.env.REACT_APP_TURN_SERVER_PASSWORD,
    publicAssets: process.env.REACT_APP_PUBLIC_ASSETS_URL,
}

export default config
