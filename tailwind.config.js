/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                soran: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                    950: '#082f49',
                },
            },
            fontFamily: {
                sans: ['"Vazirmatn"', '"Plus Jakarta Sans"', 'sans-serif'],
                kurdish: ['Raber', 'Nizar', '"Vazirmatn"', '"Noto Naskh Arabic"', 'serif'],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'wave': 'wave 1.5s ease-in-out infinite',
            },
            keyframes: {
                wave: {
                    '0%, 100%': { height: '10%' },
                    '50%': { height: '100%' },
                },
            },
        },
    },
    plugins: [],
}
