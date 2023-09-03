/**
 * @file 構文チェックに利用するESLintの設定ファイル。
 */

// eslint-disable-next-line no-undef
module.exports = {
    env: {
        browser: true,
        node: true,
        es2021: true,
    },
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    overrides: [],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
    plugins: ["@typescript-eslint", "import", "unused-imports"],
    rules: {
        "unused-imports/no-unused-imports": "warn",
        "import/order": [
            "warn",
            {
                groups: [
                    "builtin",
                    "external",
                    "internal",
                    "parent",
                    "sibling",
                    "index",
                    "object",
                    "type",
                ],
                "newlines-between": "always",
                pathGroupsExcludedImportTypes: ["builtin"],
                alphabetize: { order: "asc", caseInsensitive: true },
            },
        ],
    },
};
