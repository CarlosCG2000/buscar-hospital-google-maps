
// 4_(2.5) Una promesa para que cuando cargue la libreria de Google Maps
let googleMapsPromiseResolver = null

// 4.1_me quedo en una variable con aquello que tengo que llamar cuando el Google Maps Promise acabe
let googleMapsPromise = new Promise((resolver) => {
    googleMapsPromiseResolver = resolver
})

// 1_funcion initMap: que nos muestra el mapa
function initMap() {
    console.log("Esta cargada la libreria de la API de Google Maps")
    googleMapsPromiseResolver() // 4.2_llamo a la promesa cuando se que Google Maps ya a cargado la librera (es decir dentro de initMap())
}

//2_Evento que se ejecutando cuando se ya este cargado el DOM
document.addEventListener("DOMContentLoaded", async function () {

    let usuarioPosicion = null // 2.1_
    let map = null
    let hospitalPosicion = null // 2.12_

    // 2.6_Dentro de esta función estoy esperando a que mi página cargue, y con este valor voy a esperar (await) que todas estas promesas (Promise.all) se resuelvan: la promesa de cargar la libreria de Google Maps y la de que el usuario me haya pasado su ubicación.
    // Entonces tengo la garantia de que a partir de esta linea ambas cosas (apis) se hallan cargado y pueda utilizarlas
    // values es un array que devuelve el resuelto de cada promesa en cada elemento
    const values = await Promise.all([googleMapsPromise, getUsuarioPosicion()]) //2.6
    // usuarioPosicion = await getUsuarioPosicion() //2.2_esperamos a que se cumpla la promesa de a traves de la función creada obtenemos la ubicación del usuario
    usuarioPosicion = new google.maps.LatLng(values[1].coords.latitude, values[1].coords.longitude) // 2.7_recogemos los valores de la posicion
    console.log(usuarioPosicion)

    // 2.4_Cargamos el mapa. Pero antes de llamar al mapa tengo que garantizar que la libreria de Google Maps esta inicializada y cargada y esto no es algo que se encuentre en el DOM (no quiere decir que se hace cuando se carga el DOM), es algo que nos lo confirma que la libreria esta cargarda cuando esta en la función 'initMap()' y esto se consigue esperando con una promesa de que se va a cargar la libreria
    map = new google.maps.Map(document.getElementById("map"), { //decimos donde cargamos el nuevo mapa con unas opciones
        center: { lat: -34.397, lng: 150.644 },
        zoom: 12,
    });

    // 2.8_hacemos que la posicion cambie a los datos de la posicion (es la posicion en la que actualmente se encuentra el usuario)
    map.panTo(usuarioPosicion)

    //2.10_Llamamos a la funcion con la promesa (es decir hay que poner el await ahora) del hospital mas cercano a nuestra localización
    const hospital = await encontrarHospitarCercano(map, usuarioPosicion)
    console.log(hospital)

    // 3.12_Posición del hospital mas cercano
    hospitalPosicion = new google.maps.LatLng(hospital.geometry.location.lat(), hospital.geometry.location.lng())

    //2.11_Pintamos el nombre y la direccion en el html del hospital más cercano
    document.querySelector("#hospital-name").innerHTML = hospital.name
    document.querySelector("#hospital-address").innerHTML = hospital.vicinity

    //2.13_Evento cuando pulsemos el boton para crear la ruta desde tu ubicación hasta el hospital mas cercano
    document.querySelector("#go-to").addEventListener("click", function () {
        // Necesitamos la libreria Directions Services (para saber la dirección con las instrucciones)
        let directionsService = new google.maps.DirectionsService()
        // Necesitamos la libreria Directions Renderer (para pintar la linea del mapa con la dirección)
        let directionsRenderer = new google.maps.DirectionsRenderer()

        directionsRenderer.setMap(map) // le decimos en que mapa tiene que pintar la direcciones

        let request = { // la respuesta
            origin: usuarioPosicion,
            destination: hospitalPosicion,
            travelMode: google.maps.TravelMode['WALKING']
        }

        directionsService.route(request, function (response, status) { // en ese callback es donde nos va a devolver el resultado de la direccion
            if (status === 'OK') {
                directionsRenderer.setDirections(response)
            }
        })
    })

})

// 3_(2.3) Api de geocalización del navegador
function getUsuarioPosicion() {
    return new Promise((resolver, rejecter) => { // es una operación que esperamos que se complete a futuro (y la necesitamos porque no sabemos si va aceptar el usuario o no la geocalización en el navegador y cuando lo va a hacer)
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((posicion) => { // obtenemos la posición a traves de la promesa
                resolver(posicion) //resolvemos la posicion (dando la promesa)
            })
        } else {
            rejecter() // rechazamos la promesa
        }
    })
}

//5_(2.9) Función para buscar el hospital mas cercano
function encontrarHospitarCercano(map, usuarioPosicion) {
    //Necesitamos que se cargue la liberia de 'Places Sevice', es decir para ello si es una función futura necesitaremos una promesa, como anteriormente
    return new Promise(function (resolver) {
        let request = { // obtener la respuesta
            location: usuarioPosicion, // alrededor de esta posicion
            radius: 20000, // en un radio de 20000 metros (20km)
            type: ['hospital'] // buscar hospitales
        }

        let service = new google.maps.places.PlacesService(map) // le pasamos el mapa

        service.nearbySearch(request, function (results) { // en ese callback es donde nos va a devolver el resultado del primer hospital mas cercano
            resolver(results.shift()) // Resolvemos la promesa aqui '.shift()' es de JS y es para que saque solo el primer resultado (hospital)
        })
    })
}