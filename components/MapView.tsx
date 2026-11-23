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

type Props = {
  origem: Coordenada;
  unidades: Unidade[];
  selecionada: { id: string; solicitacao: number } | null;
  onSelecionar: (id: string) => void;
};

function AtualizarCamera({
  origem,
  unidades,
  selecionada,
}: Pick<Props, "origem" | "unidades" | "selecionada">) {
  const map = useMap();
  const unidadeSelecionadaId = selecionada?.id;
  const solicitacao = selecionada?.solicitacao;

  useEffect(() => {
    const unidade = unidadeSelecionadaId
      ? unidades.find(({ id }) => id === unidadeSelecionadaId)
      : undefined;

    if (unidade) {
      map.setView([unidade.lat, unidade.lng], 16);
    } else {
      map.setView([origem.lat, origem.lng]);
    }
  }, [
    map,
    origem.lat,
    origem.lng,
    unidadeSelecionadaId,
    solicitacao,
    unidades,
  ]);

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
      />
      <AtualizarCamera
        origem={origem}
        unidades={unidades}
        selecionada={selecionada}
      />
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
