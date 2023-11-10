import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "./SearchStation.css";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// 訪問済みアイコン
const visitedIzakayaIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1321/1321913.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

// 通常アイコン
const izakayaIcon = new L.Icon({
  iconUrl: "https://i.ibb.co/J5wwLM2/041818-removebg-preview.png",
  iconSize: [55, 55],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

//現在位置アイコン（Leafletのデフォルトが使えないため）
const drunkguy = new L.Icon({
  iconUrl: 'https://i.ibb.co/Q8hKNGB/3a1f104dd63aa49ddb01f711654e8119-t-removebg-preview.png',
  iconSize: [100, 100], 
  iconAnchor: [25, 50], 
  popupAnchor: [0, -50], 
});


const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

const stations = [
  { name: "Tokyo Station", latitude: 35.681236, longitude: 139.767125 },
  { name: "Shinjuku Station", latitude: 35.689592, longitude: 139.700413 },
  { name: "Shibuya Station", latitude: 35.658034, longitude: 139.701636 },
  { name: "Ikebukuro Station", latitude: 35.729503, longitude: 139.7109 },
  { name: "Ueno Station", latitude: 35.713768, longitude: 139.777254 },
  { name: "Akihabara Station", latitude: 35.698353, longitude: 139.773114 },
  { name: "Ginza Station", latitude: 35.674261, longitude: 139.770667 },
  { name: "Ebisu Station", latitude: 35.64669, longitude: 139.710106 },
  { name: "Shinagawa Station", latitude: 35.628471, longitude: 139.73876 },
  { name: "Meguro Station", latitude: 35.633998, longitude: 139.715828 },
  { name: "Hamamatsucho Station", latitude: 35.655646, longitude: 139.756749 },
  { name: "Shimokitazawa Station", latitude: 35.662837, longitude: 139.667571 },
  { name: "Kichijoji Station", latitude: 35.702259, longitude: 139.580333 },
  { name: "Harajuku Station", latitude: 35.670168, longitude: 139.702687 },
  { name: "Asakusa Station", latitude: 35.714555, longitude: 139.798023 },
];

const SearchStation = () => {
  const [izakayas, setIzakayas] = useState([]);
  const [visitedIzakayas, setVisitedIzakayas] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [rating, setRating] = useState(3);
  const [showConquredMessage, setShowConquredMessage] = useState(false);
  const [buttonPressed, setButtonPressed] = useState(false);
  const [selectedStation, setSelectedStation] = useState(stations[0].name);
  const [mapCenter, setMapCenter] = useState({
    lat: stations[0].latitude,
    lng: stations[0].longitude,
  });

  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId || null;
  const username = location.state?.username || null;

  function MapCenter({ center }) {
    const map = useMap();
    useEffect(() => {
      map.setView(center);
    }, [center, map]);
    return null;
  }

  const updateMapCenter = () => {
    setButtonPressed(true);
    const station = stations.find((s) => s.name === selectedStation);
    if (station) {
      setMapCenter({ lat: station.latitude, lng: station.longitude });
    }
  };

  const handleStationChange = (event) => {
    setSelectedStation(event.target.value);
  };

  const goHome = () => {
    navigate("/home", { state: { userId: userId, username: username } }); 
  };

  const fetchIzakayas = async (latitude, longitude) => {
    try {
      const response = await axios.get(`${apiUrl}/izakayas`, {
        params: { latitude, longitude },
      });
      setIzakayas(response.data);
    } catch (error) {
      console.error("could not get data", error);
    }
  };

  const fetchVisitedIzakayas = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/user/${userId}/visited-izakayas`
      );
      const visitedIds = response.data.map((item) => item.restaurant_id);
      setVisitedIzakayas(visitedIds);
    } catch (error) {
      console.error("could not get data visited", error);
    }
  };

  useEffect(() => {
    const station = stations.find((s) => s.name === selectedStation);
    if (station) {
      fetchIzakayas(station.latitude, station.longitude);
    }
  }, [selectedStation, userId]);

  const handleVisit = async () => {
    setShowPopup(false);
    if (!selectedShop) return; 
    const postData = {
      user_id: userId,
      restaurant_id: selectedShop,
      rating: rating,
      visited_at: new Date().toISOString(),
    };
    try {
      await axios.post(`${apiUrl}/markAsEaten`, postData);
      setButtonPressed(true);
      setVisitedIzakayas((prevVisited) => [...prevVisited, selectedShop.id]);
    } catch (error) {
      console.error("failed to send data", error);
    }
  };

  const checkAllConqured = () => {
    const allConqured = izakayas.every((shop) =>
      visitedIzakayas.includes(shop.id)
    );
    setShowConquredMessage(allConqured);
  };

  useEffect(() => {
    checkAllConqured();
  }, [visitedIzakayas, izakayas]);

  useEffect(() => {
    setButtonPressed(false);
    fetchIzakayas(mapCenter.lat, mapCenter.lng);
    fetchVisitedIzakayas();
    checkAllConqured();
  }, [buttonPressed, selectedStation]);

  const handleConqreMessageClose = () => {
    setShowConquredMessage(false);
  };

  return (
    <div>
      <button className="VeiwMap-toHome" onClick={goHome}>
        Go Home
      </button>
      <div className="hotpepper-credit">
        <a
          href="https://www.hotpepper.jp/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="https://webservice.recruit.co.jp/banner/hotpepper-s.gif"
            alt="提供：ホットペッパー Webサービス"
          />
        </a>
      </div>
      <div>
        <div className="station-selector">
          <select
            className="station-selector-select"
            value={selectedStation}
            onChange={handleStationChange}
          >
            {stations.map((station, index) => (
              <option key={index} value={station.name}>
                {station.name}
              </option>
            ))}
          </select>
          <button className="station-selector-button" onClick={updateMapCenter}>
            Select
          </button>
        </div>
      </div>
      <div className="map-view">
        {mapCenter.lat && mapCenter.lng ? (
          <div className="map-container">
            <MapContainer
              center={mapCenter}
              zoom={17}
              style={{ height: "100vh", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={[mapCenter.lat, mapCenter.lng]} icon={drunkguy}>
                <Popup className="popup-current-location">You are here!</Popup>
              </Marker>
              {izakayas.map((shop) => (
                <Marker
                  key={shop.id}
                  position={[shop.lat, shop.lng]}
                  icon={
                    visitedIzakayas.includes(shop.id)
                      ? visitedIzakayaIcon
                      : izakayaIcon
                  }
                  eventHandlers={{
                    click: () => {
                      setSelectedShop(shop.id);
                      setShowPopup(true);
                    },
                  }}
                >
                  <Popup className="popup-shop-info">
                    <div className="popup-shop-content">
                      <img
                        src={shop.photo.pc.l}
                        alt={shop.name}
                        style={{ width: "100px", height: "auto" }}
                      />
                      <p>{shop.name}</p>
                      <a
                        href={shop.urls.pc}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        To Hotpepper page
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
              <MapCenter center={mapCenter} />
            </MapContainer>
          </div>
        ) : (
          <p className="loading-map">Loading map...</p>
        )}
        {showPopup && selectedShop && (
          <div className="popup-modal">
            <div className="modal-content">
              <h2>Rating</h2>
              <select
                className="rating-select"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              >
                {[1, 2, 3, 4, 5].map((number) => (
                  <option key={number} value={number}>
                    {number} Star
                  </option>
                ))}
              </select>
              <button
                className="submit-rating"
                onClick={() => handleVisit(selectedShop)}
              >
                Submit
              </button>
              <button
                className="cancel-button"
                onClick={() => setShowPopup(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {showConquredMessage && (
          <div
            className="congratulations-overlay"
            onClick={handleConqreMessageClose}
          >
            <div className="congratulations-message">
              <h1>Congratulations!</h1>
              <p>You are Izakaya Master in this Area!</p>
              <button className="congratulations-button" onClick={handleConqreMessageClose}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchStation;
