import React, { useState, useEffect } from "react";
import {
  GoogleMap,
  LoadScript,
  DirectionsRenderer,
  Marker,
} from "@react-google-maps/api";

const API_KEY = "AIzaSyAlWMyam_qVoNDJLxzIBPrNPuJyvNOis40"; // Replace with your actual API Key

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const center = {
  lat: 17.348518, // Destination (KLH)
  lng: 78.339511,
};

const App = () => {
  const [busRoutes, setBusRoutes] = useState([]);
  const [startPoint, setStartPoint] = useState("");
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [directions, setDirections] = useState(null);
  const [busRouteNumber, setBusRouteNumber] = useState("");
  const [selectedBusRouteStops, setSelectedBusRouteStops] = useState([]);

  useEffect(() => {
    fetch("/data/bus_route.json")
      .then((response) => response.json())
      .then((data) => {
        console.log("Loaded bus routes:", data);
        setBusRoutes(data);
      })
      .catch((error) => console.error("Error loading bus routes:", error));
  }, []);

  const findRoute = () => {
    console.log("Find Route button clicked");

    if (!busRoutes || !Array.isArray(busRoutes)) {
      console.error("Error: Invalid JSON structure", busRoutes);
      alert("Error loading bus routes!");
      return;
    }

    console.log("Searching for:", startPoint);

    let foundRoute = null;
    let foundBusNumber = null;

    for (const route of busRoutes) {
      const stop = route.stops.find(
        (stop) => stop.stop.toLowerCase() === startPoint.toLowerCase()
      );

      if (stop) {
        foundRoute = route;
        foundBusNumber = route.bus_route;
        break;
      }
    }

    if (foundRoute) {
      console.log("Bus found:", foundBusNumber);
      setSelectedRoute(foundBusNumber);
      calculateDistance(startPoint);
    } else {
      console.warn("No bus route found for:", startPoint);
      setSelectedRoute("No bus route found for this location!");
      setDistance(null);
      setDuration(null);
    }
  };

  const calculateDistance = (startLocation) => {
    if (!window.google || !window.google.maps) {
      console.error("Google Maps API not loaded.");
      return;
    }

    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [`${startLocation}, Hyderabad`],
        destinations: [{ lat: center.lat, lng: center.lng }],
        travelMode: "DRIVING",
      },
      (response, status) => {
        if (status === "OK") {
          const result = response.rows[0].elements[0];
          if (result.status === "OK") {
            setDistance(result.distance.text);
            setDuration(result.duration.text);
          } else {
            alert("Could not find distance for this location!");
          }
        } else {
          console.error("Error fetching distance:", status);
        }
      }
    );

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: `${startLocation}, Hyderabad`,
        destination: { lat: center.lat, lng: center.lng },
        travelMode: "DRIVING",
      },
      (result, status) => {
        if (status === "OK") {
          setDirections(result);
        } else {
          console.error("Error fetching directions:", status);
        }
      }
    );
  };

  const mapBusRoute = () => {
    const route = busRoutes.find((route) => route.bus_route === busRouteNumber);

    if (route) {
      setSelectedBusRouteStops(route.stops);

      const waypoints = route.stops
        .slice(1, route.stops.length - 1)
        .map((stop) => ({
          location: { lat: stop.lat, lng: stop.lng },
          stopover: true,
        }));

      const directionsService = new window.google.maps.DirectionsService();

      directionsService.route(
        {
          origin: { lat: route.stops[0].lat, lng: route.stops[0].lng },
          destination: {
            lat: route.stops[route.stops.length - 1].lat,
            lng: route.stops[route.stops.length - 1].lng,
          },
          waypoints: waypoints,
          travelMode: "DRIVING", // Or "TRANSIT" if it is a transit route
        },
        (result, status) => {
          if (status === "OK") {
            setDirections(result);
          } else {
            console.error("Error fetching directions:", status);
          }
        }
      );
    } else {
      alert("Bus route not found!");
      setSelectedBusRouteStops([]);
      setDirections(null);
    }
  };

  return (
    <div>
      <h1>Find Your Bus</h1>
      <input
        type="text"
        placeholder="Enter Starting Point"
        value={startPoint}
        onChange={(e) => setStartPoint(e.target.value)}
      />
      <button onClick={findRoute}>Find Route</button>

      {selectedRoute && <h2>Bus Number: {selectedRoute}</h2>}
      {distance && <h3>Distance to KLH: {distance}</h3>}
      {duration && <h3>Estimated Time: {duration}</h3>}

      <div>
        <input
          type="text"
          placeholder="Enter Bus Route Number"
          value={busRouteNumber}
          onChange={(e) => setBusRouteNumber(e.target.value)}
        />
        <button onClick={mapBusRoute}>Map Bus Route</button>
      </div>

      <LoadScript googleMapsApiKey={API_KEY}>
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10}>
          {directions && <DirectionsRenderer directions={directions} />}
          {selectedBusRouteStops.map((stop) => (
            <Marker
              key={stop.stop_number}
              position={{
                lat: stop.lat,
                lng: stop.lng,
              }}
              title={stop.stop}
            />
          ))}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default App;
