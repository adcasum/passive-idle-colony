module.exports = {
  extends: ["expo"],
  ignorePatterns: ["/dist/*", "/node_modules/*", "/.expo/*"],
  rules: {
    "react-hooks/exhaustive-deps": "warn",
    "no-console": ["warn", { allow: ["warn", "error"] }],
  },
};
