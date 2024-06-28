// firebaseconfig.d.ts

declare module "firebaseconfig" {
    const firebaseConfig: {
        apiKey: string;
        authDomain: string;
        databaseURL: string;
        projectId: string;
        storageBucket: string;
        messagingSenderId: string;
        appId: string;
        measurementId?: string;
    };
    export default firebaseConfig;
}
