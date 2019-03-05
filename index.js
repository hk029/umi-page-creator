#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const inquirer = require("inquirer");
const ejs = require("ejs");
// 先把模板字符串加载
const modelTpl = fs
  .readFileSync(path.resolve(__dirname, "./template/model.ejs"))
  .toString();

const pageTpl = fs
  .readFileSync(path.resolve(__dirname, "./template/page.ejs"))
  .toString();

const pageFuncTpl = fs
  .readFileSync(path.resolve(__dirname, "./template/page-function.ejs"))
  .toString();

const { log } = console;
const srcDir = path.resolve(process.cwd(), "./src/pages");
//  判断是否有src目录
const isSrc = fs.existsSync(srcDir);
if (!isSrc) {
  log("请在umi项目的根目录执行命令（如果没有src/pages目录，请先建立）");
  return -1;
}

/**
 * @name walk
 * @description Finding all directories in src/pages
 *              寻找src/pages下所有的文件夹，方便做目录选择
 * @param {*} dir
 */
const walk = dir => {
  const ignore = [".", "models", "compenents"];
  let obj = {};
  fs.readdirSync(dir).map(file => {
    let subDir = path.resolve(dir, `./${file}`);
    let state = fs.statSync(subDir);
    if (ignore.every(reg => file.indexOf(reg) < 0) && state.isDirectory()) {
      obj[file] = walk(subDir);
    }
  });
  return obj;
};

/**
 * @name chooseDir
 * @description User can choose which directory to put their pages
 *              用户可以选择在任意目录下创建页
 * @param {} dirs 目录列表（通过walk生成）
 * @param bool first 是否第一次进入
 */
const chooseDir = (dirs, curPath, first = true) => {
  return inquirer
    .prompt([
      {
        type: "list",
        name: `pageDir`,
        message: `Choose ${
          first ? "pageDir ('/' means in 'src/pages' )" : "subDir"
        }`,
        choices: ["/"].concat(Object.keys(dirs)),
        default: "/"
      }
    ])
    .then(ans => {
      if (ans.pageDir !== "/") {
        curPath += `${ans.pageDir}/`;
        return chooseDir(dirs[ans.pageDir], curPath, false);
      }
      return Promise.resolve(curPath);
    });
};

/**
 *  main
 */

const createPage = async () => {
  let dirs = walk(srcDir);
  let curPath = "";
  chooseDir(dirs, "")
    .then(path => {
      curPath = path;
      log("curPath:", `src/pages/${curPath}`);
      return inquirer.prompt([
        {
          type: "input",
          name: "pageName",
          message: "What is your page name?"
        },
        {
          type: "confirm",
          name: "isDir",
          message: "Using separate folders? (default: yes)",
          default: true
        },
        {
          type: "confirm",
          name: "isFunc",
          message: "Using Function Components? (default: yes)",
          default: true
        },
        {
          type: "confirm",
          name: "dva",
          message: "Using dva? (default: yes)",
          default: true
        },
        {
          type: "confirm",
          name: "validation",
          message: "Using prop-types validation? (default: yes)",
          default: true
        },
        {
          type: "list",
          name: "style",
          message: "Choose your CSS Preprocessors",
          choices: ["less", "scss", "css"],
          default: "less"
        }
      ]);
    })
    .then(answers => {
      let { pageName, dva, style, isDir, validation, isFunc } = answers;
      let cap = pageName;
      cap = cap.substring(0, 1).toUpperCase() + cap.substring(1);
      let fileName = isDir ? "index" : pageName;
      const dir = path.resolve(srcDir, `./${curPath}/${isDir ? pageName : ""}`);
      // 如果当前目录是src，并且没有选择独立文件夹，那么model需要放到src/models里
      const modelDir = path.resolve(
        dir,
        `${!isDir && !curPath ? "../" : ""}models`
      );
      const model = path.resolve(modelDir, `${pageName}.js`);
      const page = path.resolve(dir, `${fileName}.jsx`);
      const xcss = path.resolve(dir, `${fileName}.${style}`);
      const modelText = ejs.render(modelTpl, { pageName, curPath });
      const pageText = ejs.render(isFunc ? pageFuncTpl : pageTpl , {
        dva,
        validation,
        pageName,
        css: `${fileName}.${style}`
      });
      // log(dir, page, model);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      if (dva && !fs.existsSync(modelDir)) {
        fs.mkdirSync(path.resolve(modelDir));
      }
      fs.writeFileSync(page, pageText);
      fs.writeFileSync(xcss, ".container{\n\tdisplay: block;\n}");
      dva && fs.writeFileSync(model, modelText);
      return inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: "Continue creating new page?",
          default: false
        }
      ]);
    })
    .then(answers => {
      const { confirm } = answers;
      if (confirm) {
        return createPage();
      }
      log("All done!");
      return 1;
    });
};

createPage();
