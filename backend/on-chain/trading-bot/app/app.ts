import {
    establishConnection,
    establishPayer,
    checkProgram,
} from './app/solarbitrage';

async function main() {
    console.log('Starting smart contract...');

    await establishConnection();

    await establishPayer();

    await checkProgram();

    console.log('Success')
}

main().then(
    () => process.exit(),
    err => {
        console.error(err);
        process.exit(-1);
    }
)