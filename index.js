#!/usr/bin/env node

const puppeteer = require("puppeteer");
const yargs = require("yargs");

const defaultLoginURL =
  "https://logowanie.pg.edu.pl/login?service=https%3A%2F%2Fenauczanie.pg.edu.pl%2Fmoodle%2Flogin%2Findex.php%3FauthCAS%3DCAS";

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
              describe: "Turn on fullscreen mode",
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

async function main() {
  const args = parseArguments();

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: args.width,
      height: args.height,
    },
  });
  const page = (await browser.pages())[0];

  await login(page, args.loginURL, args.username, args.password);
  await page.goto(args.redirect);
  await browser.close();
}

main();
