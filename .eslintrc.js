module.exports = {
    extends: ['airbnb-typescript-prettier'],
    rules: {
        // todo: review
        'prettier/prettier': 'error',
        'react/jsx-filename-extension': [1, { extensions: ['.jsx', '.tsx'] }],
        'react-hooks/exhaustive-deps': 'off',
        'react/jsx-no-bind': 'off',
        'import/no-unresolved': 'off',
        'react/jsx-no-constructed-context-values': 'off',
        'react/jsx-no-useless-fragment': 'off',
        'react/no-unstable-nested-components': 'off',
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
    parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
    },
    ignorePatterns: ['config-overrides.js'],
}
