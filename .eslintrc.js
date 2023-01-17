module.exports = {
  "env": {
    "node": true,
    "es6": true,
    "jquery": true,
    "browser": true,
  },
  "globals": {
    "session": "readonly",
    "request": "readonly",
    "response": "readonly",
    "MercadoPago": "readonly",
    "describe": "readonly",
    "it": "readonly",
    "history": "readonly",
    "location": "readonly",
  },
  "extends": ["airbnb-base"],
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "ecmaFeatures": {
      "modules": true,
    },
  },
  "rules": {
    "no-var": "error",
    "prefer-const": "error",
    "complexity": ["error", { "max": 6 }],
    "eqeqeq": "error",
    "curly": "error",
    "prefer-template": "off",
    "quotes": ["error", "double", { "avoidEscape": true, "allowTemplateLiterals": true }],
    "no-plusplus": ["error", { "allowForLoopAfterthoughts": true }],
    "import/no-unresolved": "off",
    "import/extensions": ["error", { "js": "never" }],
    "operator-linebreak": "off",
    "object-curly-newline": ["error", {
      "ImportDeclaration": { "multiline": true, "minProperties": 4 }
    }],
    "implicit-arrow-linebreak": ["error", "beside"],
    "no-param-reassign": ["error", { "props": false }],
    "no-underscore-dangle": "off",
    "no-redeclare": "off",
    "comma-dangle": ["error", "never"],
    "object-shorthand": ["error", "never"]
  },
};
