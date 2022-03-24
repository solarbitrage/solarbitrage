"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
/**
 * Connection to the network
 */
let connection;
/**
 * Keypair associated to the fees' payer
 */
let payer;
/**
 * Hello world's program id
 */
let programId;
/**
* Path to program files
*/
const PROGRAM_PATH = path_1.default.resolve(__dirname, '../../dist/program');
/**
 * Path to program shared object file which should be deployed on chain.
 * This file is created when running either:
 *   - `npm run build:program-c`
 *   - `npm run build:program-rust`
 */
const PROGRAM_SO_PATH = path_1.default.join(PROGRAM_PATH, 'helloworld.so');
