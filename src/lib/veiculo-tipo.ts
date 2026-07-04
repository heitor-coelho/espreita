import type { TipoVeiculo } from "@prisma/client";

export const TIPO_VEICULO_LABEL: Record<TipoVeiculo, string> = {
  MOTO: "Moto",
  CARRO: "Carro",
  OUTRO: "Outro",
};

export const TIPOS_VEICULO: TipoVeiculo[] = ["MOTO", "CARRO", "OUTRO"];
