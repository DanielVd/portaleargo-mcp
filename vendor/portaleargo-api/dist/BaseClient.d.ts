import type { APILogin, APIProfilo, ClientOptions, Credentials, Dashboard, HttpMethod, Json, LoginLink, FamigliaAPIDettagliProfilo, FamigliaAPIDashboard, FamigliaAPILogin, FamigliaAPIMutationResponse, FamigliaAPIProfilo, FamigliaAPIRicevimenti, FamigliaAPICorsiRecupero, ReadyClient, Token } from "./types";
/**
 * Un client per interagire con l'API
 */
export declare abstract class BaseClient {
    #private;
    static readonly BASE_URL = "https://www.portaleargo.it";
    static readonly FAMIGLIA_BASE_URL = "https://didattica.portaleargo.it/famiglia/api";
    static readonly FAMIGLIA_VERSION = "4.1.0";
    /**
     * A custom fetch implementation
     */
    fetch: typeof fetch;
    /**
     * I dati del token
     */
    token?: Token;
    /**
     * I dati del login
     */
    loginData?: APILogin["data"][number];
    /**
     * Dati della sessione applicativa della API Famiglia.
     *
     * Restano separati da loginData finché la migrazione non è completa.
     */
    apiSession?: FamigliaAPILogin["data"][number];
    /**
     * Profilo restituito dalla API Famiglia.
     */
    famigliaProfile?: FamigliaAPIProfilo["data"];
    /**
     * Dashboard restituita dalla API Famiglia.
     *
     * Resta separata da dashboard finché la migrazione non è completa.
     */
    famigliaDashboard?: FamigliaAPIDashboard["data"]["dati"][number];
    /**
     * I dati del profilo
     */
    profile?: APIProfilo["data"];
    /**
     * I dati della dashboard
     */
    dashboard?: Dashboard;
    /**
     * Se scrivere nella console alcuni dati utili per il debug
     */
    debug: boolean;
    /**
     * Headers aggiuntivi per ogni richiesta API
     */
    headers?: Record<string, string>;
    /**
     * Le funzioni per leggere e scrivere i dati.
     * Impostare questo valore forzerà `dataPath` a `null`
     */
    dataProvider?: NonNullable<ClientOptions["dataProvider"]>;
    /**
     * La versione di didUp da specificare nell'header.
     * * Modificare questa opzione potrebbe creare problemi nell'utilizzo della libreria
     */
    version: string;
    /**
     * Le credenziali usate per l'accesso
     */
    credentials?: Partial<Credentials>;
    /**
     * @param options - Le opzioni per il client
     */
    constructor(options?: ClientOptions);
    /**
     * Controlla se il client è pronto
     */
    isReady(): this is ReadyClient;
    /**
     * Effettua una richiesta API.
     * @param path - Il percorso della richiesta
     * @param options - Altre opzioni
     * @returns La risposta
     */
    apiRequest<T extends Json>(path: string, options?: Partial<{
        body: Json;
        method: HttpMethod;
        noWait: false;
    }>): Promise<T>;
    apiRequest<T extends Json>(path: string, options: {
        body?: Json;
        method?: HttpMethod;
        noWait: true;
    }): Promise<Omit<Response, "json"> & {
        json: () => Promise<T>;
    }>;
    /**
     * Effettua una richiesta alla API Famiglia.
     */
    famigliaRequest<T extends Json>(path: string, options?: Partial<{
        body: Json;
        method: HttpMethod;
        noWait: false;
    }>): Promise<T>;
    famigliaRequest<T extends Json>(path: string, options: {
        body?: Json;
        method?: HttpMethod;
        noWait: true;
    }): Promise<Omit<Response, "json"> & {
        json: () => Promise<T>;
    }>;
    /**
     * Inizializza la sessione applicativa della API Famiglia
     * utilizzando il Bearer OAuth già ottenuto dal client.
     */
    bootstrapSession(): Promise<{
        codMin: string;
        opzioni: {
            valore: boolean;
            chiave: string;
        }[];
        isPrimoAccesso: boolean;
        profiloDisabilitato: boolean;
        isResetPassword: boolean;
        isSpid: boolean;
        token: string;
        username: string;
    }>;
    /**
     * Recupera il profilo dalla API Famiglia.
     */
    getProfilo(): Promise<{
        resetPassword: boolean;
        ultimoCambioPwd: string | null;
        anno: {
            anno: string;
            dataInizio: string;
            dataFine: string;
        };
        annoCorrente: {
            anno: string;
            dataInizio: string;
            dataFine: string;
        };
        genitore: {
            desEMail: string;
            nominativo: string;
            genitorePK: string;
        };
        profiloDisabilitato: boolean;
        isSpid: boolean;
        alunno: {
            isUltimaClasse: boolean;
            nominativo: string;
            cognome: string;
            nome: string;
            alunnoPK: string;
            maggiorenne: boolean;
            desEmail: string | null;
        };
        scheda: {
            pk: string;
            anno: number;
            aggiornaSchedaPK: boolean;
            classe: {
                pk: string;
                desDenominazione: string;
                desSezione: string;
            };
            sede: {
                pk: string;
                descrizione: string;
            };
            scuola: {
                pk: string;
                desOrdine: string;
                descrizione: string;
            };
            corso: {
                pk: string;
                descrizione: string;
            };
        };
        primoAccesso: boolean;
        profiloStorico: boolean;
    }>;
    /**
     * Recupera la dashboard dalla API Famiglia.
     */
    getDashboard(): Promise<{
        [key: string]: Json;
    }>;
    /**
     * Effettua il login.
     * @returns Il client aggiornato
     */
    login(): Promise<ReadyClient & this & {
        dashboard: Dashboard;
    }>;
    /**
     * Carica i dati salvati localmente.
     */
    loadData(): Promise<void>;
    /**
     * Aggiorna il client, se necessario.
     * @returns Il nuovo token
     */
    refreshToken(): Promise<Token>;
    /**
     * Ottieni il token tramite l'API.
     * @param code - The code for the access
     * @returns I dati del token
     */
    getToken(code?: LoginLink & {
        code: string;
    }): Promise<Token>;
    /**
     * Rimuovi il profilo.
     */
    logOut(): Promise<void>;
    /**
     * Ottieni i dettagli del profilo dello studente.
     * @returns I dati
     */
    getDettagliProfilo<T extends FamigliaAPIDettagliProfilo["data"]>(old?: T): Promise<{
        utente: {
            flgUtente: string;
        };
        genitore: {
            pk: string;
            desNome: string;
            desCognome: string;
            flgSesso: string;
            datNascita: string;
            desTelefono: string;
            desCellulare: string | null;
            desEMail: string;
        };
        titoliStudio: {
            prgTitolo: number;
            desTitolo: string;
        }[];
        alunno: {
            pk: string;
            nome: string;
            cognome: string;
            desEmail: string | null;
            maggiorenne: boolean;
            sesso: string;
            datNascita: string;
            desTelefono: string;
            desCellulare: string | null;
            desCf: string;
            desVia: string;
            desCap: string;
            desComuneResidenza: string;
            desComuneNascita: string;
            desComuneRecapito: string;
            desIndirizzoRecapito: string;
            cittadinanza: string;
            desCapResidenza: string;
            ultimaClasse: boolean;
        };
        attivita: {
            codAttivita: string;
            desDescrizione: string;
        }[];
    }>;
    /**
     * Ottieni l'orario giornaliero.
     * @param date - Il giorno dell'orario
     * @returns Le lezioni della giornata
     */
    getOrarioGiornaliero(date?: {
        year?: number;
        month?: number;
        day?: number;
    }): Promise<{
        scuAnagrafePK: string;
        desNome: string;
        desCognome: string;
        desEmail: string;
        docente: string;
        desDenominazione: string;
        desSezione: string;
        materia: string;
        numOra: number;
        mostra: boolean;
    }[]>;
    /**
     * Ottieni il link per scaricare un allegato della bacheca.
     * @param uid - L'uid dell'allegato
     * @returns L'url
     */
    getLinkAllegato(uid: string): Promise<string>;
    /**
     * Scarica un allegato della bacheca.
     *
     * Il link restituito da Argo è temporaneo, quindi viene richiesto e
     * consumato immediatamente.
     *
     * @param uid - L'uid dell'allegato
     * @returns La risposta HTTP contenente il file
     */
    downloadAllegato(uid: string): Promise<Response>;
    /**
     * Ottieni il link per scaricare un allegato della bacheca alunno.
     * @param uid - l'uid dell'allegato
     * @param pkScheda - L'id del profilo
     * @returns L'url
     */
    getLinkAllegatoStudente(uid: string, pkScheda?: string): Promise<string>;
    /**
     * Scarica un allegato della bacheca alunno.
     *
     * Il link restituito da Argo è temporaneo, quindi viene richiesto e
     * consumato immediatamente.
     *
     * @param uid - L'uid dell'allegato
     * @param pkScheda - L'id del profilo
     * @returns La risposta HTTP contenente il file
     */
    downloadAllegatoStudente(uid: string, pkScheda?: string | undefined): Promise<Response>;
    /**
     * Ottieni i dati di una ricevuta telematica.
     * @param iuv - L'iuv del pagamento
     * @returns La ricevuta
     */
    getRicevuta(iuv: string): Promise<{
        fileName: string;
        url: string;
    }>;
    /**
     * Ottieni i voti dello scrutinio dello studente.
     * @returns I dati
     */
    getVotiScrutinio(): Promise<Json[] | undefined>;
    /**
     * Ottieni i dati riguardo i ricevimenti dello studente.
     * @returns I dati
     */
    getRicevimenti<T extends FamigliaAPIRicevimenti["data"]>(old?: T): Promise<{
        disponibilita: Record<string, Json>;
        genitoreOAlunno: {
            desEMail: string;
            nominativo: string;
            pk: string;
            telefono: string;
        }[];
        listaDisponibilita: Json[];
        tipoAccesso: string;
        prenotazioni: Json[];
    }>;
    /**
     * Ottieni le tasse dello studente.
     * @param pkScheda - L'id del profilo
     * @returns I dati
     */
    getTasse(pkScheda?: string): Promise<{
        tasse: import("./types").FamigliaAPITassa[];
        isPagoOnlineAttivo: boolean;
        isPagOnlineAttivo: boolean;
        listaTasse: import("./types").FamigliaAPITassa[];
    }>;
    /**
     * Ottieni i dati del PCTO dello studente.
     * @param pkScheda - L'id del profilo
     * @returns I dati
     */
    getPCTOData(pkScheda?: string | undefined): Promise<{
        percorsi: any[];
        pk: string;
    }[]>;
    /**
     * Ottieni i dati dei corsi di recupero dello studente.
     * @param pkScheda - L'id del profilo
     * @returns I dati
     */
    getCorsiRecupero<T extends FamigliaAPICorsiRecupero["data"]>(pkScheda?: string, old?: T): Promise<{
        corsiRecupero: Json[];
        periodi: Json[];
    }>;
    /**
     * Ottieni il curriculum dello studente.
     * @param pkScheda - L'id del profilo
     * @returns I dati
     */
    getCurriculum(pkScheda?: string): Promise<{
        pkScheda: string;
        classe: string;
        anno: number;
        esito: Json;
        mostraCredito: boolean;
        credito: number;
        isSuperiore: boolean;
        isInterruzioneFR: boolean;
        media?: string;
        ordineScuola: string;
        mostraInfo: boolean;
        cvabilitato: boolean;
    }[]>;
    /**
     * Ottieni lo storico della bacheca.
     * @param pkScheda - L'id del profilo
     * @returns I dati
     */
    getStoricoBacheca(pkScheda: string): Promise<{
        pk: string;
        categoria: string;
        messaggio: string;
        autore: string;
        data: string;
        dataScadenza: string;
        url: string;
        isPresaVisione: boolean;
        dataConfermaPresaVisione?: string;
        isPresaAdesioneConfermata: boolean;
        adRichiesta: boolean;
        pvRichiesta: boolean;
        listaAllegati: {
            pk: string;
            url: string;
            path: string;
            descrizioneFile: string;
            nomeFile: string;
        }[];
        datEvento: string;
    }[]>;
    /**
     * Ottieni lo storico della bacheca alunno.
     * @param pkScheda - L'id del profilo
     * @returns I dati
     */
    getStoricoBachecaAlunno(pkScheda: string): Promise<{
        nomeFile: string;
        datEvento: string;
        messaggio: string;
        data: string;
        flgDownloadGenitore: string;
        isPresaVisione: boolean;
        pk: string;
    }[]>;
    /**
     * Conferma la presa visione di un avviso della bacheca.
     *
     * Argo richiede che almeno un allegato dell'avviso venga scaricato
     * prima della conferma. Se l'uid non viene fornito, viene risolto
     * automaticamente il primo allegato dell'avviso dalla bacheca.
     *
     * @param pkScheda - L'id del profilo
     * @param prgMessaggio - Il pk dell'avviso
     * @param allegatoUid - Il pk di un allegato dell'avviso; opzionale
     * @returns Il risultato della conferma
     */
    confirmPresaVisioneBacheca(pkScheda: string, prgMessaggio: string, allegatoUid?: string): Promise<FamigliaAPIMutationResponse>;
    /**
     * Conferma la presa visione di un documento della bacheca alunno.
     *
     * @param prgMessaggio - Il pk del documento
     * @returns Il risultato della conferma
     */
    confirmPresaVisioneBachecaAlunno(prgMessaggio: string): Promise<FamigliaAPIMutationResponse>;
    /**
     * Conferma o annulla l'adesione a un avviso della bacheca.
     *
     * L'endpoint ufficiale è un toggle: una seconda chiamata rimuove
     * un'adesione già confermata.
     */
    togglePresaAdesioneBacheca(pkScheda: string, prgMessaggio: string): Promise<FamigliaAPIMutationResponse>;
    /**
     * Conferma la presa visione di una nota disciplinare.
     */
    confirmPresaVisioneNota(pk: string): Promise<FamigliaAPIMutationResponse>;
    /**
     * Giustifica uno o più eventi di appello.
     *
     * @param assenze - Identificativi degli eventi da giustificare
     * @param datGiorno - Giorno della giustificazione
     * @param descrizione - Motivazione
     */
    giustificaEventi(assenze: string[], datGiorno: string, descrizione: string): Promise<FamigliaAPIMutationResponse>;
    /**
     * Ottieni i dati della dashboard.
     * @returns La dashboard
     */
    private getLegacyDashboard;
    /**
     * Scarica immediatamente un URL firmato restituito da Argo.
     */
    private downloadSignedUrl;
    private getLegacyProfilo;
    private getLoginData;
    private logToken;
    private rimuoviProfilo;
    private what;
    private aggiornaData;
    private checkReady;
    protected abstract getCode(): Promise<LoginLink & {
        code: string;
    }>;
}
