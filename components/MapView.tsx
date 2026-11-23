"use client";
import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Coordenada, Unidade } from "@/types/unidade";

const icone = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function Recentralizar({ centro }: { centro: Coordenada }) {
  const map = useMap();
  useEffect(() => {
    map.setView([centro.lat, centro.lng]);
  }, [centro, map]);
  return null;
}

function AjustarTamanho() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const ajustar = () => map.invalidateSize({ pan: false });
    const observer = new ResizeObserver(ajustar);
    observer.observe(container);
    window.addEventListener("resize", ajustar);
    const frame = window.requestAnimationFrame(ajustar);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", ajustar);
      window.cancelAnimationFrame(frame);
    };
  }, [map]);

  return null;
}

type Props = {
  origem: Coordenada;
  unidades: Unidade[];
  selecionada: { id: string; solicitacao: number } | null;
  onSelecionar: (id: string) => void;
};

function FocarUnidade({
  unidades,
  selecionada,
}: Pick<Props, "unidades" | "selecionada">) {
  const map = useMap();

  useEffect(() => {
    if (!selecionada) return;
    const unidade = unidades.find(({ id }) => id === selecionada.id);
    if (!unidade) return;

    map.setView([unidade.lat, unidade.lng], 16);
  }, [map, selecionada, unidades]);

  return null;
}

export default function MapView({
  origem,
  unidades,
  selecionada,
  onSelecionar,
}: Props) {
  return (
    <MapContainer
      center={[origem.lat, origem.lng]}
      zoom={13}
      className="h-full w-full"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
        keepBuffer={4}
        updateWhenIdle={false}
        updateWhenZooming={false}
      />
      <AjustarTamanho />
      <Recentralizar centro={origem} />
      <FocarUnidade unidades={unidades} selecionada={selecionada} />
      <CircleMarker center={[origem.lat, origem.lng]} radius={8} />
      {unidades.map((u) => (
        <Marker
          key={u.id}
          position={[u.lat, u.lng]}
          icon={icone}
          eventHandlers={{ click: () => onSelecionar(u.id) }}
        >
          <Popup>
            {u.nome}
            <br />
            Total: {u.total_min} min
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
