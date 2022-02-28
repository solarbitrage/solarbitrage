"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var fs_1 = require("mz/fs");
var web3_js_1 = require("@solana/web3.js");
var sdk_1 = require("@orca-so/sdk");
var decimal_js_1 = require("decimal.js");
var main = function () { return __awaiter(void 0, void 0, void 0, function () {
    var secretKeyString, secretKey, owner, connection, orca, pools, orcaUSDCPool, USDCToken, USDCAmount, USDCquote, USDCorcaAmount, orcaSolPool, solToken, solAmount, quote, orcaAmount, swapPayload, swapTxId, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, fs_1.readFile)("/Users/noelb/my-solana-wallet/my-keypair.json", {
                    encoding: "utf8"
                })];
            case 1:
                secretKeyString = _a.sent();
                secretKey = Uint8Array.from(JSON.parse(secretKeyString));
                owner = web3_js_1.Keypair.fromSecretKey(secretKey);
                connection = new web3_js_1.Connection("https://api.devnet.solana.com", "singleGossip");
                orca = (0, sdk_1.getOrca)(connection, sdk_1.Network.DEVNET);
                _a.label = 2;
            case 2:
                _a.trys.push([2, 7, , 8]);
                pools = [
                    sdk_1.OrcaPoolConfig.ORCA_USDC,
                    sdk_1.OrcaPoolConfig.SOL_USDC,
                    sdk_1.OrcaPoolConfig.BTC_USDC,
                    sdk_1.OrcaPoolConfig.ORCA_SOL
                ];
                orcaUSDCPool = orca.getPool(sdk_1.OrcaPoolConfig.ORCA_USDC);
                USDCToken = orcaUSDCPool.getTokenB();
                USDCAmount = new decimal_js_1["default"](1);
                return [4 /*yield*/, orcaUSDCPool.getQuote(USDCToken, USDCAmount)];
            case 3:
                USDCquote = _a.sent();
                USDCorcaAmount = USDCquote.getMinOutputAmount();
                orcaSolPool = orca.getPool(sdk_1.OrcaPoolConfig.ORCA_SOL);
                solToken = orcaSolPool.getTokenB();
                solAmount = new decimal_js_1["default"](0.1);
                return [4 /*yield*/, orcaSolPool.getQuote(solToken, solAmount)];
            case 4:
                quote = _a.sent();
                orcaAmount = quote.getMinOutputAmount();
                console.log("Swapertoto ".concat(solAmount.toString(), " SOL for at least ").concat(orcaAmount.toNumber(), " ORCA"));
                return [4 /*yield*/, orcaSolPool.swap(owner, solToken, solAmount, orcaAmount)];
            case 5:
                swapPayload = _a.sent();
                return [4 /*yield*/, swapPayload.execute()];
            case 6:
                swapTxId = _a.sent();
                console.log("Swapped:", swapTxId, "\n");
                return [3 /*break*/, 8];
            case 7:
                err_1 = _a.sent();
                console.warn(err_1);
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
main()
    .then(function () {
    console.log("Done");
})["catch"](function (e) {
    console.error(e);
});
