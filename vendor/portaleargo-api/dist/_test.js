var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/_test.ts
import "dotenv/config";

// src/Client.ts
import { CookieClient } from "http-cookie-agent/undici";
import { existsSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { join as join3 } from "node:path";
import { cwd, env } from "node:process";
import { CookieJar as CookieJar2 } from "tough-cookie";
import {
  fetch as fetch2,
  interceptors as interceptors2,
  Pool
} from "undici";

// src/util/Constants.ts
var clientId = "72fd6dea-d0ab-4bb9-8eaa-3ac24c84886c";
var defaultVersion = "1.27.0";

// src/util/encryptCodeVerifier.ts
var encoder = new TextEncoder();
var encryptCodeVerifier = /* @__PURE__ */ __name(async (codeVerifier) => btoa(
  String.fromCharCode(
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", encoder.encode(codeVerifier))
    )
  )
).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""), "encryptCodeVerifier");

// src/util/formatDate.ts
var formatDate = /* @__PURE__ */ __name((date) => {
  date = new Date(date);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}.${date.getMilliseconds().toString().padStart(3, "0")}`;
}, "formatDate");

// src/util/randomString.ts
var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
var randomString = /* @__PURE__ */ __name((length) => {
  let result = "";
  for (let i = 0; i < length; i++)
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  return result;
}, "randomString");

// src/util/generateLoginLink.ts
var generateLoginLink = /* @__PURE__ */ __name(async ({
  redirectUri = "it.argosoft.didup.famiglia.new://login-callback",
  scopes = ["openid", "offline", "profile", "user.roles", "argo"],
  codeVerifier = randomString(43),
  challenge,
  id = clientId,
  state = randomString(22),
  nonce = randomString(22)
} = {}) => {
  challenge ??= await encryptCodeVerifier(codeVerifier);
  return {
    url: `https://auth.portaleargo.it/oauth2/auth?redirect_uri=${encodeURIComponent(
      redirectUri
    )}&client_id=${id}&response_type=code&prompt=login&state=${state}&nonce=${nonce}&scope=${encodeURIComponent(
      scopes.join(" ")
    )}&code_challenge=${challenge}&code_challenge_method=S256`,
    redirectUri,
    scopes,
    codeVerifier,
    challenge,
    clientId: id,
    state,
    nonce
  };
}, "generateLoginLink");

// src/util/getToken.ts
var getToken = /* @__PURE__ */ __name(async (code) => {
  const date = /* @__PURE__ */ new Date();
  const res = await fetch("https://auth.portaleargo.it/oauth2/token", {
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code: code.code,
      grant_type: "authorization_code",
      redirect_uri: "it.argosoft.didup.famiglia.new://login-callback",
      code_verifier: code.codeVerifier,
      client_id: clientId
    }).toString(),
    method: "POST"
  });
  const data = await res.json();
  const expireDate = new Date(res.headers.get("date") ?? date);
  if ("error" in data)
    throw new Error(`${data.error} ${data.error_description}`);
  expireDate.setSeconds(expireDate.getSeconds() + data.expires_in);
  return Object.assign(data, { expireDate });
}, "getToken");

// src/util/handleOperation.ts
var handleOperation = /* @__PURE__ */ __name((array, old = [], ...[pk]) => {
  const toDelete = [];
  const getPk = pk ?? ((a) => a.pk);
  for (const a of array)
    if (a.operazione === "D") toDelete.push(a.pk);
    else {
      const { operazione, ...rest } = a;
      const found = old.find((b) => a.pk === getPk(b));
      if (found) Object.assign(found, rest);
      else old.push(rest);
    }
  return old.filter((a) => {
    const p = getPk(a);
    toDelete.unshift(p);
    return !toDelete.includes(p, 1);
  });
}, "handleOperation");

// src/BaseClient.ts
var BaseClient = class _BaseClient {
  /**
   * @param options - Le opzioni per il client
   */
  constructor(options = {}) {
    /**
     * A custom fetch implementation
     */
    this.fetch = fetch;
    this.#ready = false;
    this.credentials = {
      schoolCode: options.schoolCode,
      password: options.password,
      username: options.username
    };
    this.token = options.token;
    this.loginData = options.loginData;
    this.profile = options.profile;
    this.dashboard = options.dashboard;
    this.debug = options.debug ?? false;
    this.version = options.version ?? defaultVersion;
    this.headers = options.headers;
    if (options.dataProvider !== null) this.dataProvider = options.dataProvider;
  }
  static {
    __name(this, "BaseClient");
  }
  static {
    this.BASE_URL = "https://www.portaleargo.it";
  }
  static {
    this.FAMIGLIA_BASE_URL = "https://didattica.portaleargo.it/famiglia/api";
  }
  static {
    this.FAMIGLIA_VERSION = "4.1.0";
  }
  #ready;
  /**
   * Controlla se il client è pronto
   */
  isReady() {
    return this.#ready;
  }
  async apiRequest(path, options = {}) {
    const headers = {
      accept: "application/json",
      "argo-client-version": this.version,
      authorization: `Bearer ${this.token?.access_token ?? ""}`
    };
    options.method ??= options.body ? "POST" : "GET";
    if (options.body != null) headers["content-type"] = "application/json";
    if (this.loginData) {
      headers["x-auth-token"] = this.loginData.token;
      headers["x-cod-min"] = this.loginData.codMin;
    }
    if (this.token)
      headers["x-date-exp-auth"] = formatDate(this.token.expireDate);
    if (this.headers) Object.assign(headers, this.headers);
    const res = await this.fetch(
      `${_BaseClient.BASE_URL}/appfamiglia/api/rest/${path}`,
      {
        headers,
        method: options.method,
        body: options.body != null ? JSON.stringify(options.body) : void 0
      }
    );
    if (this.debug) console.debug(`${options.method} /${path} ${res.status}`);
    return options.noWait ? res : res.json();
  }
  async famigliaRequest(path, options = {}) {
    const headers = {
      accept: "application/json",
      "argo-client-version": _BaseClient.FAMIGLIA_VERSION,
      "os-type": "WEB",
      authorization: `Bearer ${this.token?.access_token ?? ""}`
    };
    options.method ??= options.body ? "POST" : "GET";
    if (options.body != null)
      headers["content-type"] = "application/json";
    if (this.apiSession) {
      headers["x-auth-token"] = this.apiSession.token;
      headers["x-cod-min"] = this.apiSession.codMin;
    }
    if (this.headers) Object.assign(headers, this.headers);
    const res = await this.fetch(
      `${_BaseClient.FAMIGLIA_BASE_URL}/${path}`,
      {
        headers,
        method: options.method,
        body: options.body != null ? JSON.stringify(options.body) : void 0
      }
    );
    if (this.debug)
      console.debug(
        `${options.method} ${_BaseClient.FAMIGLIA_BASE_URL}/${path} ${res.status}`
      );
    return options.noWait ? res : res.json();
  }
  /**
   * Inizializza la sessione applicativa della API Famiglia
   * utilizzando il Bearer OAuth già ottenuto dal client.
   */
  async bootstrapSession() {
    await this.refreshToken();
    const login = await this.famigliaRequest("login", {
      method: "POST",
      body: {}
    });
    if (!login.success)
      throw new Error(
        login.message ?? login.msg ?? "Famiglia API login failed"
      );
    const [apiSession] = login.data;
    if (!apiSession) throw new Error("Famiglia API login returned no session");
    this.apiSession = apiSession;
    return apiSession;
  }
  /**
   * Recupera il profilo dalla API Famiglia.
   */
  async getProfilo() {
    if (!this.apiSession) await this.bootstrapSession();
    const profile = await this.famigliaRequest("profilo");
    if (!profile.success)
      throw new Error(
        profile.message ?? profile.msg ?? "Famiglia profile request failed"
      );
    this.famigliaProfile = profile.data;
    return this.famigliaProfile;
  }
  /**
   * Recupera la dashboard dalla API Famiglia.
   */
  async getDashboard() {
    if (!this.apiSession) await this.bootstrapSession();
    if (!this.famigliaProfile) await this.getProfilo();
    const dashboard = await this.famigliaRequest(
      "dashboard/dashboard",
      {
        method: "POST",
        body: {
          dataultimoaggiornamento: formatDate(
            this.famigliaProfile.anno.dataInizio
          ),
          opzioni: JSON.stringify(
            Object.fromEntries(
              this.apiSession.opzioni.map(({ chiave, valore }) => [
                chiave,
                valore
              ])
            )
          )
        }
      }
    );
    if (!dashboard.success)
      throw new Error(
        dashboard.message ?? dashboard.msg ?? "Famiglia dashboard request failed"
      );
    const [data] = dashboard.data.dati;
    if (!data)
      throw new Error("Famiglia dashboard returned no data");
    this.famigliaDashboard = data;
    return data;
  }
  /**
   * Effettua il login.
   * @returns Il client aggiornato
   */
  async login() {
    await Promise.all([
      this.token && this.dataProvider?.write("token", this.token),
      this.loginData && this.dataProvider?.write("login", this.loginData),
      this.profile && this.dataProvider?.write("profile", this.profile),
      this.dashboard && this.dataProvider?.write("dashboard", this.dashboard)
    ]);
    await this.loadData();
    const oldToken = this.token;
    await this.refreshToken();
    if (!this.loginData) await this.getLoginData();
    if (oldToken) {
      this.logToken({
        oldToken,
        isWhat: this.profile !== void 0
      }).catch(console.error);
      if (this.profile) {
        const whatData = await this.what(
          this.dashboard?.dataAggiornamento ?? this.profile.anno.dataInizio
        );
        if (whatData.isModificato || whatData.differenzaSchede) {
          Object.assign(this.profile, whatData);
          void this.dataProvider?.write("profile", this.profile);
        }
        this.#ready = true;
        if (whatData.mostraPallino || !this.dashboard)
          await this.getLegacyDashboard();
        this.aggiornaData().catch(console.error);
        return this;
      }
    }
    if (!this.profile) await this.getLegacyProfilo();
    this.#ready = true;
    await this.getLegacyDashboard();
    return this;
  }
  /**
   * Carica i dati salvati localmente.
   */
  async loadData() {
    if (!this.dataProvider?.read) return;
    const [token, loginData, profile, dashboard] = await Promise.all([
      this.token ? void 0 : this.dataProvider.read("token"),
      this.loginData ? void 0 : this.dataProvider.read("login"),
      this.profile ? void 0 : this.dataProvider.read("profile"),
      this.dashboard ? void 0 : this.dataProvider.read("dashboard")
    ]);
    if (token)
      this.token = { ...token, expireDate: new Date(token.expireDate) };
    if (loginData) this.loginData = loginData;
    if (profile) this.profile = profile;
    if (dashboard)
      this.dashboard = {
        ...dashboard,
        dataAggiornamento: new Date(dashboard.dataAggiornamento)
      };
  }
  /**
   * Aggiorna il client, se necessario.
   * @returns Il nuovo token
   */
  async refreshToken() {
    if (!this.token) return this.getToken();
    if (this.token.expireDate.getTime() <= Date.now()) {
      const date = /* @__PURE__ */ new Date();
      const res = await this.apiRequest("auth/refresh-token", {
        body: {
          "r-token": this.token.refresh_token,
          "client-id": clientId,
          scopes: `[${this.token.scope.split(" ").join(", ")}]`,
          "old-bearer": this.token.access_token,
          "primo-accesso": "false",
          "ripeti-login": "false",
          "exp-bearer": formatDate(this.token.expireDate),
          "ts-app": formatDate(date),
          proc: "initState_global_random_12345",
          username: this.loginData?.username ?? this.credentials?.username
        },
        noWait: true
      });
      const expireDate = new Date(res.headers.get("date") ?? date);
      const token = await res.json();
      if ("error" in token)
        throw new Error(`${token.error} ${token.error_description}`);
      expireDate.setSeconds(expireDate.getSeconds() + token.expires_in);
      this.token = Object.assign(this.token, token, { expireDate });
      void this.dataProvider?.write("token", this.token);
    }
    return this.token;
  }
  /**
   * Ottieni il token tramite l'API.
   * @param code - The code for the access
   * @returns I dati del token
   */
  async getToken(code) {
    code ??= await this.getCode();
    const { expireDate, ...token } = await getToken(code);
    this.token = Object.assign(this.token ?? {}, token, { expireDate });
    void this.dataProvider?.write("token", this.token);
    return this.token;
  }
  /**
   * Rimuovi il profilo.
   */
  async logOut() {
    if (!this.token || !this.loginData)
      throw new Error("Client is not logged in!");
    await this.rimuoviProfilo();
    delete this.token;
    delete this.loginData;
    delete this.profile;
    delete this.dashboard;
    delete this.apiSession;
    delete this.famigliaProfile;
    delete this.famigliaDashboard;
  }
  /**
   * Ottieni i dettagli del profilo dello studente.
   * @returns I dati
   */
  async getDettagliProfilo(old) {
    if (!this.apiSession) await this.bootstrapSession();
    const body = await this.famigliaRequest(
      "dettaglioprofilo",
      {
        method: "POST",
        body: {}
      }
    );
    if (!body.success)
      throw new Error(
        body.message ?? body.msg ?? "Famiglia profile details request failed"
      );
    return Object.assign(old ?? {}, body.data);
  }
  /**
   * Ottieni l'orario giornaliero.
   * @param date - Il giorno dell'orario
   * @returns Le lezioni della giornata
   */
  async getOrarioGiornaliero(date) {
    if (!this.apiSession) await this.bootstrapSession();
    const now = /* @__PURE__ */ new Date();
    const orario = await this.famigliaRequest(
      "famiglia/orario-giorno",
      {
        method: "POST",
        body: {
          datGiorno: formatDate(
            `${date?.year ?? now.getFullYear()}-${date?.month ?? now.getMonth() + 1}-${date?.day ?? now.getDate()}`
          )
        }
      }
    );
    if (!orario.success)
      throw new Error(
        orario.message ?? orario.msg ?? "Famiglia timetable request failed"
      );
    return Object.values(orario.data.dati).flat();
  }
  /**
   * Ottieni il link per scaricare un allegato della bacheca.
   * @param uid - L'uid dell'allegato
   * @returns L'url
   */
  async getLinkAllegato(uid2) {
    if (!this.apiSession) await this.bootstrapSession();
    const download = await this.famigliaRequest(
      "famiglia/downloadallegatobacheca",
      {
        method: "POST",
        body: { uid: uid2 }
      }
    );
    if (!download.success)
      throw new Error(
        download.message ?? download.msg ?? "Famiglia attachment request failed"
      );
    return download.url;
  }
  /**
   * Scarica un allegato della bacheca.
   *
   * Il link restituito da Argo è temporaneo, quindi viene richiesto e
   * consumato immediatamente.
   *
   * @param uid - L'uid dell'allegato
   * @returns La risposta HTTP contenente il file
   */
  async downloadAllegato(uid2) {
    const url = await this.getLinkAllegato(uid2);
    return this.downloadSignedUrl(url);
  }
  /**
   * Ottieni il link per scaricare un allegato della bacheca alunno.
   * @param uid - l'uid dell'allegato
   * @param pkScheda - L'id del profilo
   * @returns L'url
   */
  async getLinkAllegatoStudente(uid2, pkScheda) {
    if (!this.apiSession) await this.bootstrapSession();
    if (!pkScheda && !this.famigliaProfile) await this.getProfilo();
    const resolvedPkScheda = pkScheda ?? this.famigliaProfile?.scheda.pk ?? this.profile?.scheda.pk;
    if (!resolvedPkScheda)
      throw new Error("Student profile id is unavailable");
    const download = await this.famigliaRequest(
      "famiglia/downloadallegatobachecaalunno",
      {
        method: "POST",
        body: { uid: uid2, pkScheda: resolvedPkScheda }
      }
    );
    if (!download.success)
      throw new Error(
        download.message ?? download.msg ?? "Famiglia student attachment request failed"
      );
    return download.url;
  }
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
  async downloadAllegatoStudente(uid2, pkScheda = this.profile?.scheda.pk) {
    const url = await this.getLinkAllegatoStudente(uid2, pkScheda);
    return this.downloadSignedUrl(url);
  }
  /**
   * Ottieni i dati di una ricevuta telematica.
   * @param iuv - L'iuv del pagamento
   * @returns La ricevuta
   */
  async getRicevuta(iuv) {
    if (!this.apiSession) await this.bootstrapSession();
    const ricevuta = await this.famigliaRequest(
      "pagamenti/ricevutatelematica",
      {
        method: "POST",
        body: { iuv }
      }
    );
    if (!ricevuta.success)
      throw new Error(
        ricevuta.message ?? ricevuta.msg ?? "Famiglia telematic receipt request failed"
      );
    const { success, ...rest } = ricevuta;
    void success;
    return rest;
  }
  /**
   * Ottieni i voti dello scrutinio dello studente.
   * @returns I dati
   */
  async getVotiScrutinio() {
    if (!this.apiSession) await this.bootstrapSession();
    const voti = await this.famigliaRequest(
      "famiglia/votiscrutinio",
      {
        method: "POST",
        body: {}
      }
    );
    if (!voti.success)
      throw new Error(
        voti.message ?? voti.msg ?? "Famiglia scrutiny grades request failed"
      );
    return voti.data.votiScrutinio[0]?.periodi;
  }
  /**
   * Ottieni i dati riguardo i ricevimenti dello studente.
   * @returns I dati
   */
  async getRicevimenti(old) {
    if (!this.apiSession) await this.bootstrapSession();
    const ricevimenti = await this.famigliaRequest(
      "ricevimento/load",
      {
        method: "POST",
        body: {}
      }
    );
    if (!ricevimenti.success)
      throw new Error(
        ricevimenti.message ?? ricevimenti.msg ?? "Famiglia meetings request failed"
      );
    return Object.assign(old ?? {}, ricevimenti.data);
  }
  /**
   * Ottieni le tasse dello studente.
   * @param pkScheda - L'id del profilo
   * @returns I dati
   */
  async getTasse(pkScheda) {
    if (!this.apiSession) await this.bootstrapSession();
    if (!pkScheda && !this.famigliaProfile) await this.getProfilo();
    const resolvedPkScheda = pkScheda ?? this.famigliaProfile?.scheda.pk ?? this.profile?.scheda.pk;
    if (!resolvedPkScheda)
      throw new Error("Student profile id is unavailable");
    const taxes = await this.famigliaRequest(
      "pagamenti/listatassealunni",
      {
        method: "POST",
        body: { pkScheda: resolvedPkScheda }
      }
    );
    if (!taxes.success)
      throw new Error(
        taxes.message ?? taxes.msg ?? "Famiglia taxes request failed"
      );
    const { success, msg, message, data, ...rest } = taxes;
    void success;
    void msg;
    void message;
    return {
      ...rest,
      tasse: data
    };
  }
  /**
   * Ottieni i dati del PCTO dello studente.
   * @param pkScheda - L'id del profilo
   * @returns I dati
   */
  async getPCTOData(pkScheda = this.profile?.scheda.pk) {
    this.checkReady();
    const pcto = await this.apiRequest("pcto", {
      body: { pkScheda }
    });
    if (!pcto.success) throw new Error(pcto.msg);
    return pcto.data.pcto;
  }
  /**
   * Ottieni i dati dei corsi di recupero dello studente.
   * @param pkScheda - L'id del profilo
   * @returns I dati
   */
  async getCorsiRecupero(pkScheda, old) {
    void pkScheda;
    if (!this.apiSession) await this.bootstrapSession();
    const courses = await this.famigliaRequest(
      "famiglia/corsirecupero",
      {
        method: "POST",
        body: {}
      }
    );
    if (!courses.success)
      throw new Error(
        courses.message ?? courses.msg ?? "Famiglia recovery courses request failed"
      );
    return Object.assign(old ?? {}, courses.data);
  }
  /**
   * Ottieni il curriculum dello studente.
   * @param pkScheda - L'id del profilo
   * @returns I dati
   */
  async getCurriculum(pkScheda) {
    void pkScheda;
    if (!this.apiSession) await this.bootstrapSession();
    const curriculum = await this.famigliaRequest(
      "famiglia/curriculum-alunno",
      {
        method: "GET"
      }
    );
    if (!curriculum.success)
      throw new Error(
        curriculum.message ?? curriculum.msg ?? "Famiglia curriculum request failed"
      );
    return curriculum.data.curriculum;
  }
  /**
   * Ottieni lo storico della bacheca.
   * @param pkScheda - L'id del profilo
   * @returns I dati
   */
  async getStoricoBacheca(pkScheda) {
    if (!this.apiSession) await this.bootstrapSession();
    const bacheca = await this.famigliaRequest(
      "famiglia/storicobacheca",
      {
        method: "POST",
        body: { pkScheda }
      }
    );
    if (!bacheca.success)
      throw new Error(
        bacheca.message ?? bacheca.msg ?? "Famiglia bulletin request failed"
      );
    return bacheca.data.bacheca.map(({ operazione, ...item }) => item);
  }
  /**
   * Ottieni lo storico della bacheca alunno.
   * @param pkScheda - L'id del profilo
   * @returns I dati
   */
  async getStoricoBachecaAlunno(pkScheda) {
    if (!this.apiSession) await this.bootstrapSession();
    const bacheca = await this.famigliaRequest(
      "famiglia/storicobachecaalunno",
      {
        method: "POST",
        body: { pkScheda }
      }
    );
    if (!bacheca.success)
      throw new Error(
        bacheca.message ?? bacheca.msg ?? "Famiglia student bulletin request failed"
      );
    return bacheca.data.bachecaAlunno.filter(({ operazione }) => operazione !== "D").map(({ operazione, ...item }) => item);
  }
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
  async confirmPresaVisioneBacheca(pkScheda, prgMessaggio, allegatoUid) {
    if (!this.apiSession) await this.bootstrapSession();
    let resolvedAllegatoUid = allegatoUid;
    if (!resolvedAllegatoUid) {
      const notice = (await this.getStoricoBacheca(pkScheda)).find(
        ({ pk }) => pk === prgMessaggio
      );
      if (!notice)
        throw new Error("Famiglia bulletin item not found");
      resolvedAllegatoUid = notice.listaAllegati[0]?.pk;
      if (!resolvedAllegatoUid)
        throw new Error(
          "Famiglia bulletin read confirmation requires at least one attachment"
        );
    }
    const attachment = await this.downloadAllegato(resolvedAllegatoUid);
    await attachment.arrayBuffer();
    const result = await this.famigliaRequest(
      "famiglia/presavisione",
      {
        method: "POST",
        body: { pkScheda, prgMessaggio }
      }
    );
    if (!result.success)
      throw new Error(
        result.message ?? result.msg ?? "Famiglia read confirmation failed"
      );
    return result;
  }
  /**
   * Conferma la presa visione di un documento della bacheca alunno.
   *
   * @param prgMessaggio - Il pk del documento
   * @returns Il risultato della conferma
   */
  async confirmPresaVisioneBachecaAlunno(prgMessaggio) {
    if (!this.apiSession) await this.bootstrapSession();
    const result = await this.famigliaRequest(
      "famiglia/presavisionebachecaalunno",
      {
        method: "POST",
        body: { prgMessaggio }
      }
    );
    if (!result.success)
      throw new Error(
        result.message ?? result.msg ?? "Famiglia student bulletin read confirmation failed"
      );
    return result;
  }
  /**
   * Conferma o annulla l'adesione a un avviso della bacheca.
   *
   * L'endpoint ufficiale è un toggle: una seconda chiamata rimuove
   * un'adesione già confermata.
   */
  async togglePresaAdesioneBacheca(pkScheda, prgMessaggio) {
    if (!this.apiSession) await this.bootstrapSession();
    const result = await this.famigliaRequest(
      "famiglia/presaadesione",
      {
        method: "POST",
        body: { pkScheda, prgMessaggio }
      }
    );
    if (!result.success)
      throw new Error(
        result.message ?? result.msg ?? "Famiglia bulletin adhesion failed"
      );
    return result;
  }
  /**
   * Conferma la presa visione di una nota disciplinare.
   */
  async confirmPresaVisioneNota(pk) {
    if (!this.apiSession) await this.bootstrapSession();
    const result = await this.famigliaRequest(
      "famiglia/presavisionenote",
      {
        method: "POST",
        body: { pk }
      }
    );
    if (!result.success)
      throw new Error(
        result.message ?? result.msg ?? "Famiglia note read confirmation failed"
      );
    return result;
  }
  /**
   * Giustifica uno o più eventi di appello.
   *
   * @param assenze - Identificativi degli eventi da giustificare
   * @param datGiorno - Giorno della giustificazione
   * @param descrizione - Motivazione
   */
  async giustificaEventi(assenze, datGiorno, descrizione) {
    if (!this.apiSession) await this.bootstrapSession();
    const result = await this.famigliaRequest(
      "famiglia/giustifica",
      {
        method: "POST",
        body: {
          assenze: assenze.join("###"),
          datGiorno,
          descrizione
        }
      }
    );
    if (!result.success)
      throw new Error(
        result.message ?? result.msg ?? "Famiglia absence justification failed"
      );
    return result;
  }
  /**
   * Ottieni i dati della dashboard.
   * @returns La dashboard
   */
  async getLegacyDashboard() {
    this.checkReady();
    const date = /* @__PURE__ */ new Date();
    const res = await this.apiRequest("dashboard/dashboard", {
      body: {
        dataultimoaggiornamento: formatDate(
          this.dashboard?.dataAggiornamento ?? this.profile.anno.dataInizio
        ),
        opzioni: JSON.stringify(
          Object.fromEntries(
            (this.dashboard ?? this.loginData).opzioni.map((a) => [
              a.chiave,
              a.valore
            ])
          )
        )
      },
      noWait: true
    });
    const body = await res.json();
    if (!body.success) throw new Error(body.msg);
    const [data] = body.data.dati;
    this.dashboard = Object.assign(
      (data.rimuoviDatiLocali ? null : this.dashboard) ?? {},
      {
        ...data,
        fuoriClasse: handleOperation(
          data.fuoriClasse,
          data.rimuoviDatiLocali ? void 0 : this.dashboard?.fuoriClasse
        ),
        promemoria: handleOperation(
          data.promemoria,
          data.rimuoviDatiLocali ? void 0 : this.dashboard?.promemoria
        ),
        bacheca: handleOperation(
          data.bacheca,
          data.rimuoviDatiLocali ? void 0 : this.dashboard?.bacheca
        ),
        voti: handleOperation(
          data.voti,
          data.rimuoviDatiLocali ? void 0 : this.dashboard?.voti
        ),
        bachecaAlunno: handleOperation(
          data.bachecaAlunno,
          data.rimuoviDatiLocali ? void 0 : this.dashboard?.bachecaAlunno
        ),
        registro: handleOperation(
          data.registro,
          data.rimuoviDatiLocali ? void 0 : this.dashboard?.registro
        ),
        appello: handleOperation(
          data.appello,
          data.rimuoviDatiLocali ? void 0 : this.dashboard?.appello
        ),
        prenotazioniAlunni: handleOperation(
          data.prenotazioniAlunni,
          data.rimuoviDatiLocali ? void 0 : this.dashboard?.prenotazioniAlunni,
          (a) => a.prenotazione.pk
        ),
        dataAggiornamento: new Date(res.headers.get("date") ?? date)
      }
    );
    void this.dataProvider?.write("dashboard", this.dashboard);
    return this.dashboard;
  }
  /**
   * Scarica immediatamente un URL firmato restituito da Argo.
   */
  async downloadSignedUrl(url) {
    const response = await this.fetch(url);
    if (!response.ok)
      throw new Error(
        `Attachment download failed: HTTP ${response.status} ${response.statusText}`
      );
    return response;
  }
  async getLegacyProfilo() {
    const profile = await this.apiRequest("profilo");
    if (!profile.success) throw new Error(profile.msg);
    this.profile = Object.assign(this.profile ?? {}, profile.data);
    void this.dataProvider?.write("profile", this.profile);
    return this.profile;
  }
  async getLoginData() {
    const login = await this.apiRequest("login", {
      body: {
        "lista-opzioni-notifiche": "{}",
        "lista-x-auth-token": "[]",
        clientID: randomString(163)
      }
    });
    if (!login.success) throw new Error(login.msg);
    this.loginData = Object.assign(this.loginData ?? {}, login.data[0]);
    void this.dataProvider?.write("login", this.loginData);
    return this.loginData;
  }
  async logToken(options) {
    const res = await this.apiRequest("logtoken", {
      body: {
        bearerOld: options.oldToken.access_token,
        dateExpOld: formatDate(options.oldToken.expireDate),
        refreshOld: options.oldToken.refresh_token,
        bearerNew: this.token?.access_token,
        dateExpNew: this.token?.expireDate && formatDate(this.token.expireDate),
        refreshNew: this.token?.refresh_token,
        isWhat: (options.isWhat ?? false).toString(),
        isRefreshed: (this.token?.access_token === options.oldToken.access_token).toString(),
        proc: "initState_global_random_12345"
      }
    });
    if (!res.success) throw new Error(res.msg);
  }
  async rimuoviProfilo() {
    const res = await this.apiRequest("rimuoviprofilo", {
      body: {}
    });
    if (!res.success) throw new Error(res.msg);
    await this.dataProvider?.reset();
  }
  async what(lastUpdate, old) {
    const authToken = JSON.stringify([this.loginData?.token]);
    const opzioni = (this.dashboard ?? this.loginData)?.opzioni;
    const what = await this.apiRequest("dashboard/what", {
      body: {
        dataultimoaggiornamento: formatDate(lastUpdate),
        opzioni: opzioni && JSON.stringify(
          Object.fromEntries(opzioni.map((a) => [a.chiave, a.valore]))
        ),
        "lista-x-auth-token": authToken,
        "lista-x-auth-token-account": authToken
      }
    });
    if (!what.success) throw new Error(what.msg);
    return Object.assign(old ?? {}, what.data.dati[0]);
  }
  async aggiornaData() {
    const res = await this.apiRequest("dashboard/aggiornadata", {
      body: { dataultimoaggiornamento: formatDate(/* @__PURE__ */ new Date()) }
    });
    if (!res.success) throw new Error(res.msg);
  }
  checkReady() {
    if (!this.isReady()) throw new Error("Client is not logged in!");
  }
};

// src/util/getCode.ts
import { CookieAgent } from "http-cookie-agent/undici";
import { ok } from "node:assert";
import { URL as URL2, URLSearchParams as URLSearchParams2 } from "node:url";
import { CookieJar } from "tough-cookie";
import { interceptors, request } from "undici";
var getCode = /* @__PURE__ */ __name(async (credentials) => {
  const link = await generateLoginLink();
  const dispatcher = new CookieAgent({
    allowH2: true,
    autoSelectFamily: true,
    autoSelectFamilyAttemptTimeout: 1,
    cookies: { jar: new CookieJar() }
  }).compose(
    interceptors.retry(),
    interceptors.redirect({ maxRedirections: 3 })
  );
  const url = (await request(link.url, { dispatcher, maxRedirections: 0 })).headers.location;
  ok(typeof url === "string", "Invalid login url");
  const challenge = new URL2(url).searchParams.get("login_challenge");
  ok(challenge, "Invalid login challenge");
  const { location } = await request(
    "https://www.portaleargo.it/auth/sso/login",
    {
      dispatcher,
      body: new URLSearchParams2({
        challenge,
        client_id: clientId,
        famiglia_customer_code: credentials.schoolCode,
        login: "true",
        password: credentials.password,
        username: credentials.username
      }).toString(),
      headers: { "content-type": "application/x-www-form-urlencoded" },
      method: "POST"
    }
  ).then((r) => r.headers);
  ok(typeof location === "string", "Invalid login redirect");
  const code = new URL2(location).searchParams.get("code");
  ok(code, "Invalid login code");
  return { ...link, code };
}, "getCode");

// src/util/importData.ts
import { readFile } from "node:fs/promises";
import { join } from "node:path";
var importData = /* @__PURE__ */ __name(async (name, path) => {
  try {
    return JSON.parse(
      await readFile(join(path, `${name}.json`), {
        encoding: "utf8"
      })
    );
  } catch {
    return void 0;
  }
}, "importData");

// src/util/writeToFile.ts
import { writeFile } from "node:fs/promises";
import { join as join2 } from "node:path";
var writeToFile = /* @__PURE__ */ __name((name, value, path) => writeFile(`${join2(path, name)}.json`, JSON.stringify(value)).catch(
  console.error
), "writeToFile");

// src/Client.ts
var factory = /* @__PURE__ */ __name((origin, opts) => new CookieClient(origin, {
  ...opts,
  cookies: { jar: new CookieJar2() }
}), "factory");
var Client = class _Client extends BaseClient {
  /**
   * @param options - Le opzioni per il client
   */
  constructor(options = {}) {
    super(options);
    this.fetch = this.createFetch();
    this.credentials = {
      schoolCode: options.schoolCode ?? env.CODICE_SCUOLA,
      password: options.password ?? env.PASSWORD,
      username: options.username ?? env.NOME_UTENTE
    };
    this.dispatcher = new Pool(BaseClient.BASE_URL, {
      allowH2: true,
      autoSelectFamily: true,
      factory,
      ...options.poolOptions
    }).compose(
      interceptors2.retry({
        maxRetries: 4,
        minTimeout: 100,
        timeoutFactor: 4,
        maxTimeout: 1e4,
        ...options.retryOptions
      }),
      interceptors2.cache({
        cacheByDefault: 36e5,
        type: "private",
        ...options.cacheOptions
      })
    );
    if (options.dataProvider !== null)
      this.dataProvider ??= _Client.createDataProvider(
        options.dataPath ?? void 0
      );
  }
  static {
    __name(this, "Client");
  }
  static createDataProvider(dataPath = join3(cwd(), ".argo")) {
    let exists = existsSync(dataPath);
    return {
      read: /* @__PURE__ */ __name((name) => importData(name, dataPath), "read"),
      write: /* @__PURE__ */ __name(async (name, value) => {
        if (!exists) {
          exists = true;
          await mkdir(dataPath);
        }
        return writeToFile(name, value, dataPath);
      }, "write"),
      reset: /* @__PURE__ */ __name(() => rm(dataPath, { recursive: true, force: true }), "reset")
    };
  }
  createFetch() {
    return (info, init) => {
      const requestInfo = info;
      const requestUrl = typeof requestInfo === "string" ? new URL(requestInfo, BaseClient.BASE_URL) : requestInfo instanceof URL ? requestInfo : new URL(requestInfo.url);
      return fetch2(requestInfo, {
        ...requestUrl.origin === BaseClient.BASE_URL ? { dispatcher: this.dispatcher } : {},
        ...init
      });
    };
  }
  async getCode() {
    if ([
      this.credentials?.password,
      this.credentials?.schoolCode,
      this.credentials?.username
    ].includes(void 0))
      throw new TypeError("Password, school code, or username missing");
    return getCode(this.credentials);
  }
};

// src/_test.ts
console.time();
var client = new Client({ debug: true });
await client.login();
var uid = client.dashboard?.bacheca.find((e) => e.listaAllegati.length)?.listaAllegati[0]?.pk;
if (uid) {
  const response = await client.downloadAllegato(uid);
  const data = await response.arrayBuffer();
  if (!data.byteLength) throw new Error("Downloaded attachment is empty");
  console.log(
    `Attachment download OK: ${response.status} ${response.headers.get("content-type") ?? "unknown"} ${data.byteLength} bytes`
  );
}
await Promise.allSettled([
  client.getCorsiRecupero(),
  client.getCurriculum().then(
    (c) => Promise.allSettled([
      client.getStoricoBacheca(c.at(-1).pkScheda),
      client.getStoricoBachecaAlunno(c.at(-1).pkScheda)
    ])
  ),
  client.getDettagliProfilo(),
  client.getOrarioGiornaliero(),
  client.getPCTOData(),
  client.getRicevimenti(),
  client.getTasse(),
  client.getVotiScrutinio()
]);
await client.logOut();
console.timeEnd();
//# sourceMappingURL=_test.js.map