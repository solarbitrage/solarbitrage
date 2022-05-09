import dotenv from "dotenv"
dotenv.config({ path: "./src/common/.env" });

interface ENV {
    FIREBASE_API_KEY: string | undefined;
    FIREBASE_DOMAIN: string | undefined;
    FIREBASE_DATABASE_URL: string | undefined;
    FIREBASE_PROJECT_ID: string | undefined;
    FIREBASE_STORAGE_BUCKET: string | undefined;
    FIREBASE_MESSAGING_SENDER_ID: string | undefined;
    FIREBASE_APP_ID: string | undefined;
    FIREBASE_EMAIL: string | undefined;
    FIREBASE_PASSWORD: string | undefined;
}

interface Config {
    FIREBASE_API_KEY: string;
    FIREBASE_DOMAIN: string;
    FIREBASE_DATABASE_URL: string;
    FIREBASE_PROJECT_ID: string;
    FIREBASE_STORAGE_BUCKET: string;
    FIREBASE_MESSAGING_SENDER_ID: string;
    FIREBASE_APP_ID: string;
    FIREBASE_EMAIL: string;
    FIREBASE_PASSWORD: string;
}

// Loading ENV interface
const getConfig = (): ENV => {
    return {
        FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
        FIREBASE_DOMAIN: process.env.FIREBASE_DOMAIN,
        FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
        FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
        FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
        FIREBASE_EMAIL: process.env.FIREBASE_EMAIL,
        FIREBASE_PASSWORD: process.env.FIREBASE_PASSWORD,
    };
};

const getSanitizedConfig = (config: ENV): Config => {
    for (const [key, value] of Object.entries(config)) {
      if (value === undefined) {
        throw new Error(`Missing key ${key} in config.env`);
      }
    }
    return config as Config;
};

const config = getConfig();

const sanitizedConfig = getSanitizedConfig(config);

export default sanitizedConfig;