/**
 * Gera o código "Pix Copia e Cola" (BR Code) — o mesmo texto que vira QR
 * code em qualquer app de banco. Implementação pura, sem SDK/API externa:
 * é só um payload EMV com checksum CRC16, especificação pública do Banco
 * Central (Manual de Padrões para Iniciação do Pix).
 *
 * Não passa por nenhum provedor pago — a chave Pix é a que a própria
 * oficina já tem no banco dela; o dinheiro cai direto lá, sem intermediário.
 */

function tlv(id: string, valor: string): string {
  const tamanho = String(valor.length).padStart(2, "0");
  return `${id}${tamanho}${valor}`;
}

function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// Remove acento e caractere fora do alfabeto aceito pelo padrão EMV (o
// Bacen recomenda só letras, número e espaço nesses campos).
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim();
}

export function gerarCodigoPix({
  chave,
  nomeRecebedor,
  cidade,
  valor,
  identificador,
}: {
  chave: string;
  nomeRecebedor: string;
  cidade?: string | null;
  valor?: number;
  identificador?: string;
}): string {
  const nome = normalizar(nomeRecebedor).slice(0, 25) || "OFICINA";
  const cidadeFormatada = normalizar(cidade || "").slice(0, 15) || "BRASIL";
  const txid = (identificador || "***").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";

  const merchantAccountInfo =
    tlv("00", "br.gov.bcb.pix") + tlv("01", chave.trim());

  const partes = [
    tlv("00", "01"), // Payload Format Indicator
    tlv("26", merchantAccountInfo), // Merchant Account Information (Pix)
    tlv("52", "0000"), // Merchant Category Code
    tlv("53", "986"), // Currency: BRL
    ...(valor && valor > 0 ? [tlv("54", valor.toFixed(2))] : []),
    tlv("58", "BR"), // Country
    tlv("59", nome), // Merchant Name
    tlv("60", cidadeFormatada), // Merchant City
    tlv("62", tlv("05", txid)), // Additional Data Field (txid)
  ];

  const semCrc = partes.join("") + "6304";
  return semCrc + crc16(semCrc);
}
