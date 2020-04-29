#!/usr/bin/env node

const puppeteer = require("puppeteer");
const yargs = require("yargs");

const defaultLoginURL =
  "https://logowanie.pg.edu.pl/login?service=https%3A%2F%2Fenauczanie.pg.edu.pl%2Fmoodle%2Flogin%2Findex.php%3FauthCAS%3DCAS";

const minimumHangTime = 60 * 1000; //60s
const hangCheckInterval = 15 * 1000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseArguments() {
  return yargs
    .command(
      "$0 <username> <password> <redirect> [options]",
      "Login into moodle and then redirect",
      (yargs) =>
        yargs
          .positional("username", { describe: "Username of account" })
          .positional("password", { describe: "Password of account" })
          .positional("redirect", {
            describe: "Redirect url after successfully login",
          })
          .options({
            l: {
              alias: "loginURL",
              default: defaultLoginURL,
              type: "string",
            },
            w: {
              alias: "width",
              describe: "Width of viewport",
              default: 720,
              type: "number",
            },
            h: {
              alias: "height",
              describe: "Height of viewport",
              default: 480,
              type: "number",
            },
            fs: {
              alias: "fullscreen",
              describe: "Turn on fullscreen mode; If set, ignore width and height options",
              default: false,
              type: "boolean",
            },
          })
    )
    .version(false).argv;
}

async function login(page, url, username, password) {
  await page.goto(url);

  await page.type("#username", username);
  await page.type("#password", password);
  await page.click("#submit_button");
}

async function endStreamCheck(page) {
  return Math.random() > 0.9; //TODO
}

async function hangUntilStreamEnd(page) {
  return new Promise(async (resolve, reject) => {
    await sleep(minimumHangTime);

    if (await endStreamCheck(page))
      resolve();

    const clock = setInterval(async () => {
      try {
        if (await endStreamCheck(page)) {
          clearInterval(clock);
          resolve();
        }
      } catch (err) {
        clearInterval(clock);
        reject(err);
      }
    }, hangCheckInterval);
  });
}

async function setupBrowser(options) {
  const browserOptions = {
    headless: false,
    defaultViewport: {
      width: options.width,
      height: options.height,
    }
  };

  if (options.fullscreen) {
    browserOptions.defaultViewport = null;
    browserOptions.options = ['--start-fullscreen'];
  }

  return puppeteer.launch(browserOptions);
}

async function main() {
  const args = parseArguments();
  let statusCode = 0;

  const browser = await setupBrowser(args);
  const page = (await browser.pages())[0];

  await login(page, args.loginURL, args.username, args.password);
  await page.goto(args.redirect);

  try {
    await hangUntilStreamEnd(page);

  } catch (err) {
    console.error(err);
    statusCode = 1;

  } finally {
    await browser.close();
    return statusCode;
  }
}

main();
