import chalk from "chalk";

const WARN_TAG = chalk.bgHex("#de2a18").hex("#FFFFFF")(" WARN ");
const INFO_TAG = chalk.bgHex("#2376b7").hex("#FFFFFF")(" INFO ");
const LOG_TAG = chalk.bgHex("#1ba784").hex("#FFFFFF")(" LOG ");
const NAME_TAG = chalk.bgHex("#737c7b").hex("#FFFFFF")(" ReplaceCover ");

export function consoleLog(type: string, info: any) {
    if (type === "INFO") {
        console.log(NAME_TAG + INFO_TAG, info);
    } else if (type === "WARN") {
        console.log(NAME_TAG + WARN_TAG, info);
    } else if (type === "LOG") {
        console.log(NAME_TAG + LOG_TAG, info);
    } else {
        console.log(NAME_TAG + NAME_TAG, info);
    }
}
