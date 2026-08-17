
const MENU = document.querySelector("#menu");
const ROUTER = document.querySelector("#ruteo");
const HOME = document.querySelector("#pantalla-home");
const REGISTRO = document.querySelector("#pantalla-registro");
const LOGIN = document.querySelector("#pantalla-login");
const AGREGARJUGADOR = document.querySelector("#pantalla-agregar");
const JUGADORES = document.querySelector("#pantalla-jugadores");
const ESTADISTICAS = document.querySelector("#pantalla-estadisticas");
const MAPA = document.querySelector("#pantalla-mapa");
const URLBASE = "https://worldcupfan.develotion.com";

let SELECCIONES = [];
let POSICIONES = [];


Inicio();

function Inicio() {
    ArmarMenu();
    Eventos();

    if (localStorage.getItem("token")) {
        window.location.hash = "#/";
    } else {
        window.location.hash = "#/login";
    }
}

function LimpiarLogin() {
    document.querySelector("#txtLoginUsuario").value = "";
    document.querySelector("#txtLoginPassword").value = "";
}

function LimpiarRegistro() {
    document.querySelector("#txtRegistroUsuario").value = "";
    document.querySelector("#txtRegistroPassword").value = "";
    document.querySelector("#slcPais").value = "";
}

function LimpiarAgregarJugador() {
    document.querySelector("#slcSeleccion").value = "";
    document.querySelector("#txtNombreJugador").value = "";
    document.querySelector("#slcPosicion").value = "";
    document.querySelector("#txtFechaNacimiento").value = null;
    document.querySelector("#txtComentario").value = "";
}

function ArmarMenu() {

    let token = localStorage.getItem("token");

    let html = ``;

    if (token) {

        html += `
            <ion-item href="/">Home</ion-item>
            <ion-item href="/agregar">Agregar jugador</ion-item>
            <ion-item href="/jugadores">Jugadores</ion-item>
            <ion-item href="/estadisticas">Estadísticas</ion-item>
            <ion-item href="/mapa">Mapa</ion-item>
            <ion-button expand="block" class="btn-secundario" onclick="CerrarSesion()">
                <ion-icon slot="start" name="log-out-outline"></ion-icon>
                Cerrar sesión
            </ion-button>
        `;

    } else {

        html += `
            <ion-item href="/login">Login</ion-item>
            <ion-item href="/registro">Registro</ion-item>
        `;

    }

    document.querySelector("#menu-opciones").innerHTML = html;
}

function Eventos() {
    ROUTER.addEventListener("ionRouteDidChange", Navegar);
    document.querySelector("#btnRegistrar").addEventListener("click", TomarDatosRegistro);
    document.querySelector("#btnLogin").addEventListener("click", TomarDatosLogin);
    document.querySelector("#btnIrRegistro").addEventListener("click", IrRegistro);
    document.querySelector("#btnAgregarJugador").addEventListener("click", AgregarJugador);
    document.querySelector("#slcFiltroSeleccion").addEventListener("ionChange", FiltrarJugadores);
}

function IrRegistro() {
    window.location.hash = "#/registro";
}

function MostrarBienvenida() {

    let usuario = localStorage.getItem("usuario");

    document.querySelector("#txtBienvenida").innerHTML =
        `¡Bienvenido a WorldCupFan ${usuario}!`;

    document.querySelector("#txtDescripcion").innerHTML =
        "Guarda tus jugadores favoritos del Mundial y consulta sus estadísticas.";

}

async function Navegar(evt) {

    OcultarPantallas();

    LimpiarLogin();
    LimpiarRegistro();
    LimpiarAgregarJugador();

    let ruta = evt.detail.to;

    if (ruta == "/") {

        HOME.style.display = "block";
        MostrarBienvenida();

    } else if (ruta == "/registro") {

        PoblarSelectPaises();
        REGISTRO.style.display = "block";

    } else if (ruta == "/login") {

        LOGIN.style.display = "block";

    } else if (ruta == "/agregar") {

        if (!localStorage.getItem("token")) {
            MandarAlLogin();
            return;
        }

        AGREGARJUGADOR.style.display = "block";
        ObtenerSelecciones();
        ObtenerPosiciones();

    } else if (ruta == "/jugadores") {

        if (!localStorage.getItem("token")) {
            MandarAlLogin();
            return;
        }

        JUGADORES.style.display = "block";

        if (SELECCIONES.length == 0) {
            await ObtenerSelecciones();
        }

        if (POSICIONES.length == 0) {
            await ObtenerPosiciones();
        }

        PoblarFiltroSelecciones();
        document.querySelector("#slcFiltroSeleccion").value = "";
        await CargarListaJugadores();

    } else if (ruta == "/estadisticas") {

        if (!localStorage.getItem("token")) {
            MandarAlLogin();
            return;
        }

        ESTADISTICAS.style.display = "block";

        if (SELECCIONES.length == 0) {
            await ObtenerSelecciones();
        }

        await CargarEstadisticas();

    } else if (ruta == "/mapa") {

        if (!localStorage.getItem("token")) {
            MandarAlLogin();
            return;
        }

        MAPA.style.display = "block";
        CrearMapa();

    }

    MENU.close();

}

async function TomarDatosLogin() {

    let usuario = document.querySelector("#txtLoginUsuario").value;
    let password = document.querySelector("#txtLoginPassword").value;

    if (DatosValidosLogin(usuario, password)) {

        let objLogin = new Object();
        objLogin.usuario = usuario;
        objLogin.password = password;

        PrenderLoader("Iniciando sesión");

        let response = await fetch(`${URLBASE}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(objLogin)
        });

        if (response.ok) {

            let data = await response.json();

            localStorage.setItem("token", data.token);
            localStorage.setItem("usuario", usuario);

            ArmarMenu();
            LimpiarLogin();
            window.location.hash = "#/";

        } else {

            let data = await response.json();
            Alertar("IMPORTANTE", "ERROR LOGIN", data.mensaje);

        }

        ApagarLoader();
    }
}


function CerrarSesion() {

    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    ArmarMenu();

    window.location.hash = "#/login";

    MENU.close();

}

async function TomarDatosRegistro() {

    let usuario = document.querySelector("#txtRegistroUsuario").value;
    let password = document.querySelector("#txtRegistroPassword").value;
    let idPais = document.querySelector("#slcPais").value;

    if (DatosValidosRegistro(usuario, password, idPais)) {

        let objReg = new Object();
        objReg.usuario = usuario;
        objReg.password = password;
        objReg.idPais = idPais;

        PrenderLoader("Registrando usuario");

        let response = await fetch(`${URLBASE}/usuarios`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(objReg)
        });

        if (response.ok) {

            let data = await response.json();

            localStorage.setItem("token", data.token);
            localStorage.setItem("usuario", usuario);

            MostrarToast("Usuario registrado correctamente", 3);

            ArmarMenu();

            LimpiarRegistro();

            window.location.hash = "#/";

        } else {

            let data = await response.json();

            Alertar("IMPORTANTE", "ERROR DE REGISTRO", data.mensaje);

        }

        ApagarLoader();
    }
}

function DatosValidosLogin(usuario, password) {

    if (usuario.trim() == "" || password.trim() == "") {
        Alertar("IMPORTANTE", "Datos inválidos", "Debe completar todos los campos.");
        return false;
    }

    return true;

}

function DatosValidosRegistro(usuario, password, idPais) {

    if (usuario.trim() == "" || password.trim() == "" || !idPais) {
        Alertar("IMPORTANTE", "Datos inválidos", "Debe completar todos los campos.");
        return false;
    }

    return true;
}

async function ObtenerSelecciones() {

    let t = localStorage.getItem("token");

    PrenderLoader("Cargando selecciones");

    let response = await fetch(`${URLBASE}/selecciones`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + t
        },
    });

    if (response.status == 401) {

        ApagarLoader();
        MandarAlLogin();
        return;

    } else {

        let data = await response.json();

        SELECCIONES = data.selecciones;

        let html = ``;

        for (let s of data.selecciones) {
            html += `<ion-select-option value="${s.id}">${s.nombre}</ion-select-option>`;
        }

        document.querySelector("#slcSeleccion").innerHTML = html;

        ApagarLoader();
    }

}

async function ObtenerPosiciones() {

    let t = localStorage.getItem("token");

    PrenderLoader("Cargando posiciones");

    let response = await fetch(`${URLBASE}/posiciones`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + t
        },
    });

    if (response.status == 401) {

        ApagarLoader();
        MandarAlLogin();
        return;

    } else {

        let data = await response.json();

        POSICIONES = data.posiciones;

        let html = ``;

        for (let p of data.posiciones) {
            html += `<ion-select-option value="${p.id}">${p.nombre}</ion-select-option>`;
        }

        document.querySelector("#slcPosicion").innerHTML = html;

        ApagarLoader();

    }

}

async function AgregarJugador() {

    let idSeleccion = document.querySelector("#slcSeleccion").value;
    let nombre = document.querySelector("#txtNombreJugador").value;
    let posicion = document.querySelector("#slcPosicion").value;
    let fechaNacimiento = document.querySelector("#txtFechaNacimiento").value;
    let comentario = document.querySelector("#txtComentario").value;

    if (DatosValidosJugador(nombre, idSeleccion, posicion, fechaNacimiento)) {

        let t = localStorage.getItem("token");

        PrenderLoader("Agregando jugador");

        // Analizar comentario
        let responseSentimiento = await fetch(`${URLBASE}/genai`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + t
            },
            body: JSON.stringify({
                prompt: comentario
            })
        });

        if (responseSentimiento.status == 401) {

            ApagarLoader();
            MandarAlLogin();
            return;

        } else {

            let dataSentimiento = await responseSentimiento.json();

            if (dataSentimiento.sentiment == "Negativo") {

                ApagarLoader();

                Alertar(
                    "IMPORTANTE",
                    "Comentario negativo",
                    "No se puede registrar un jugador con un comentario negativo."
                );

                return;
            }

            let objJugador = new Object();
            objJugador.idSeleccion = idSeleccion;
            objJugador.nombre = nombre;
            objJugador.posicion = posicion;
            objJugador.fechaNacimiento = fechaNacimiento;

            let response = await fetch(`${URLBASE}/jugadores`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + t
                },
                body: JSON.stringify(objJugador)
            });

            if (response.status == 401) {

                ApagarLoader();
                MandarAlLogin();
                return;

            } else if (!response.ok) {

                let data = await response.json();
                Alertar("IMPORTANTE", "ERROR", data.mensaje);

            } else {

                let data = await response.json();

                MostrarToast(data.mensaje, 3);

                LimpiarAgregarJugador();

                window.location.hash = "#/jugadores";

            }

        }

        ApagarLoader();

    }

}

function DatosValidosJugador(nombre, idSeleccion, posicion, fechaNacimiento) {

    if (nombre.trim() == "" || !idSeleccion || !posicion || fechaNacimiento == "") {
        Alertar("IMPORTANTE", "Datos inválidos", "Debe completar todos los campos.");
        return false;
    }

    return true;

}

function ObtenerCodigoBandera(nombre) { //funcion para que se muestren las img de banderitas en jugadores, ya que no funcionaban los emojis.

    switch (nombre) {
        case "Uruguay": return "UY";
        case "Alemania": return "DE";
        case "Arabia Saudita": return "SA";
        case "Argentina": return "AR";
        case "Brasil": return "BR";
        case "Cabo Verde": return "CV";
        case "Chile": return "CL";
        case "Colombia": return "CO";
        case "España": return "ES";
        case "Estados Unidos": return "US";
        case "Francia": return "FR";
        case "Inglaterra": return "GB";
        case "Italia": return "IT";
        case "Japón": return "JP";
        case "México": return "MX";
        case "Países Bajos": return "NL";
        case "Portugal": return "PT";
        default: return "";
    }

}

async function CargarListaJugadores(idSeleccion = null) {

    let t = localStorage.getItem("token");

    PrenderLoader("Cargando jugadores");

    let response = await fetch(`${URLBASE}/jugadores`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + t
        },
    });

    if (response.status == 401) {

        ApagarLoader();
        MandarAlLogin();
        return;

    } else {

        let data = await response.json();

        let html = ``;

        for (let j of data.jugadores) {

            if (idSeleccion == null || j.idSeleccion == idSeleccion) {

                let seleccion;
                for (let s of SELECCIONES) {
                    if (s.id == j.idSeleccion) {
                        seleccion = s;
                        break;
                    }
                }

                let posicion;
                for (let p of POSICIONES) {
                    if (p.id == j.posicion) {
                        posicion = p;
                        break;
                    }
                }

                let codigoBandera = ObtenerCodigoBandera(seleccion.nombre);

                html += `
                <ion-card>

                        <ion-item lines="none">

                                <img
                                    src="img/${codigoBandera}.png"
                                    class="bandera"
                                    alt="${seleccion.nombre}">

                            <ion-label>

                                <h2 style="font-size:1.2rem;">
                                    ${j.nombre}
                                </h2>

                                    <p>${seleccion.nombre}</p>

                            </ion-label>

                        </ion-item>

                    <ion-card-content>

                        <p><strong>Posición:</strong> ${posicion.nombre}</p>

                        <p><strong>Fecha de nacimiento:</strong> ${j.fechaNacimiento}</p>

                        <ion-button
                            expand="block"
                            class="btn-secundario"
                            shape="round"
                            onclick="ConfirmarEliminar(${j.id})">

                                Eliminar jugador

                        </ion-button>

                    </ion-card-content>

                </ion-card>
                `;
            }
        }

        document.querySelector("#listaJugadores").innerHTML = html;

        ApagarLoader();

    }

}

function FiltrarJugadores() {

    let idSeleccion = document.querySelector("#slcFiltroSeleccion").value;

    if (idSeleccion == "") {
        CargarListaJugadores();
    } else {
        CargarListaJugadores(Number(idSeleccion));
    }

}

function PoblarFiltroSelecciones() {

    let html = `<ion-select-option value="">Todas</ion-select-option>`;

    for (let s of SELECCIONES) {
        html += `<ion-select-option value="${s.id}">${s.nombre}</ion-select-option>`;
    }

    document.querySelector("#slcFiltroSeleccion").innerHTML = html;

}

async function EliminarJugador(id) {

    let t = localStorage.getItem("token");

    let filtro = document.querySelector("#slcFiltroSeleccion").value;

    PrenderLoader("Eliminando jugador");

    let response = await fetch(`${URLBASE}/jugadores/${id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + t
        },
    });

    if (response.status == 401) {

        ApagarLoader();
        MandarAlLogin();
        return;

    } else if (!response.ok) {

        let data = await response.json();
        Alertar("IMPORTANTE", "ERROR", data.mensaje);

    } else {

        MostrarToast("Jugador eliminado correctamente", 3);

        let idSeleccion = filtro == "" ? null : Number(filtro);

        await CargarListaJugadores(idSeleccion);

        document.querySelector("#slcFiltroSeleccion").value = filtro;

    }

    ApagarLoader();

}



async function ConfirmarEliminar(id) {  //Alerta confirmacion con Ionic

    const alert = document.createElement("ion-alert");

    alert.header = "Eliminar jugador";
    alert.message = "¿Está seguro que desea eliminar este jugador?";
    alert.buttons = [
        {
            text: "Cancelar",
            role: "cancel"
        },
        {
            text: "Eliminar",
            handler: () => {
                EliminarJugador(id);
            }
        }
    ];

    document.body.appendChild(alert);
    await alert.present();

}

async function CargarEstadisticas() {

    let t = localStorage.getItem("token");

    PrenderLoader("Cargando estadísticas");

    let response = await fetch(`${URLBASE}/jugadores`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + t
        },
    });

    if (response.status == 401) {

        ApagarLoader();
        MandarAlLogin();
        return;

    } else {

        let data = await response.json();

        if (data.jugadores.length == 0) {

            document.querySelector("#estadisticaSeleccion").innerHTML = "No hay jugadores registrados.";
            document.querySelector("#estadisticaTipo").innerHTML = "Sin jugadores registrados.";

            ApagarLoader();
            return;

        }

        let contadorSelecciones = {};

        let arqueros = 0;
        let jugadores = 0;

        for (let j of data.jugadores) {

            if (contadorSelecciones[j.idSeleccion]) {
                contadorSelecciones[j.idSeleccion]++;
            } else {
                contadorSelecciones[j.idSeleccion] = 1;
            }

            if (j.posicion == 1) {
                arqueros++;
            } else {
                jugadores++;
            }

        }

        let idFavorita;
        let mayor = 0;

        for (let id in contadorSelecciones) {

            if (contadorSelecciones[id] > mayor) {

                mayor = contadorSelecciones[id];
                idFavorita = id;

            }

        }

        let favorita;

        for (let s of SELECCIONES) {

            if (s.id == idFavorita) {

                favorita = s;
                break;

            }

        }

        let codigoBandera = ObtenerCodigoBandera(favorita.nombre);

        document.querySelector("#estadisticaSeleccion").innerHTML = `
                <img
                src="img/${codigoBandera}.png"
                alt="${favorita.nombre}"
                style="height:20px;width:auto;vertical-align:middle;margin-right:6px;">
                ${favorita.nombre}`;

        if (jugadores > arqueros) {

            document.querySelector("#estadisticaTipo").innerHTML = "⚽ Jugadores de campo";

        } else {

            document.querySelector("#estadisticaTipo").innerHTML = "🥅 Arqueros";

        }

    }

    ApagarLoader();

}


function MandarAlLogin() {

    localStorage.clear();
    ArmarMenu();

    Alertar(
        "Acceso restringido",
        "Iniciá sesión nuevamente."
    );

    window.location.hash = "#/login";

}



async function PoblarSelectPaises() {

    PrenderLoader("Cargando países");

    let response = await fetch(`${URLBASE}/paises`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    let data = await response.json();

    let html = ``;

    for (let p of data.paises) {
        html += `<ion-select-option value="${p.id}">${p.nombre}</ion-select-option>`;
    }

    document.querySelector("#slcPais").innerHTML = html;

    ApagarLoader();

}

function OcultarPantallas() {

    HOME.style.display = "none";
    REGISTRO.style.display = "none";
    LOGIN.style.display = "none";
    AGREGARJUGADOR.style.display = "none";
    JUGADORES.style.display = "none";
    ESTADISTICAS.style.display = "none";
    MAPA.style.display = "none";

}

//ALERTAS, TOAST Y LOADERS

const loading = document.createElement('ion-loading');

function PrenderLoader(texto) {
    loading.cssClass = 'my-custom-class';
    loading.message = texto;
    document.body.appendChild(loading);
    loading.present();
}


function ApagarLoader() {

    if (loading.isConnected) {
        loading.dismiss();
    }

}

function Alertar(titulo, subtitulo, mensaje) {
    const alert = document.createElement('ion-alert');
    alert.cssClass = 'my-custom-class';
    alert.header = titulo;
    alert.subHeader = subtitulo;
    alert.message = mensaje;
    alert.buttons = ['OK'];
    document.body.appendChild(alert);
    alert.present();
}

function MostrarToast(mensaje, duracion) {
    const toast = document.createElement('ion-toast');
    toast.message = mensaje;
    toast.duration = duracion * 1000;
    document.body.appendChild(toast);
    toast.present();
}

var map = null;

function CrearMapa() {

    PrenderLoader("Cargando mapa");

    setTimeout(function () { CargarMapa(); }, 1000);

}

async function CargarMapa() {

    let t = localStorage.getItem("token");

    if (map != null) {
        map.remove();
    }

    map = L.map("map").setView([-15, -60], 3);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        minZoom: 1,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    let responsePaises = await fetch(`${URLBASE}/paises`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + t
        }
    });

    let dataPaises = await responsePaises.json();

    let responseUsuarios = await fetch(`${URLBASE}/usuariosPorPais`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + t
        }
    });

    let dataUsuarios = await responseUsuarios.json();

    for (let p of dataPaises.paises) {

        let cantidad = 0;

        for (let u of dataUsuarios.paises) {

            if (u.id == p.id) {
                cantidad = u.cantidadDeUsuarios;
                break;
            }

        }

        L.marker([p.latitud, p.longitud])
            .addTo(map)
            .bindTooltip(`<strong>${p.nombre}</strong><br>${cantidad} usuarios`);

    }

    ApagarLoader();

}
