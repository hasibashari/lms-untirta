import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                console: "readonly",
                process: "readonly",
                Buffer: "readonly",
                setTimeout: "readonly",
                setInterval: "readonly",
                clearTimeout: "readonly",
                clearInterval: "readonly",
                URL: "readonly"
            }
        },
        rules: {
            // Memberikan peringatan jika ada variabel/import yang dideklarasikan tapi tidak dipakai
            "no-unused-vars": "warn",
            
            // Memberikan peringatan jika ada blok kode yang kosong (tidak berguna)
            "no-empty": "warn",
            
            // Menonaktifkan error untuk console.log karena biasa dipakai di backend
            "no-console": "off",

            // Peringatan jika ada unreachable code (seperti kode setelah `return` atau `throw`)
            "no-unreachable": "warn"
        }
    }
];
