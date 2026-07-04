import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

/**
 * Storage de fotos/vídeos das Revisões.
 *
 * Compatível com qualquer serviço S3-compatible (Cloudflare R2, AWS S3,
 * Supabase Storage, etc.) — só trocar as variáveis de ambiente, sem mudar
 * código. R2 é a recomendação padrão (sem custo de saída de dados, plano
 * gratuito generoso, simples de configurar).
 *
 * Fluxo: o navegador faz upload DIRETO pro storage usando uma URL assinada
 * gerada aqui (o arquivo nunca passa pelo servidor Next.js — importante pra
 * vídeo, que pode ser grande).
 */

function clienteS3() {
  return new S3Client({
    region: process.env.STORAGE_REGION || "auto",
    endpoint: process.env.STORAGE_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY ?? "",
    },
  });
}

const EXTENSOES_PERMITIDAS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "mp4",
  "mov",
  "webm",
]);

export async function gerarUrlDeUpload(nomeOriginal: string, contentType: string) {
  const extensao = nomeOriginal.split(".").pop()?.toLowerCase() ?? "";
  if (!EXTENSOES_PERMITIDAS.has(extensao)) {
    throw new Error("Tipo de arquivo não permitido. Envie foto ou vídeo.");
  }

  const bucket = process.env.STORAGE_BUCKET;
  const urlPublicaBase = process.env.STORAGE_PUBLIC_URL;
  if (!bucket || !urlPublicaBase) {
    throw new Error(
      "Storage não configurado. Preencha STORAGE_BUCKET e STORAGE_PUBLIC_URL no .env.",
    );
  }

  const chave = `revisoes/${randomUUID()}.${extensao}`;

  const comando = new PutObjectCommand({
    Bucket: bucket,
    Key: chave,
    ContentType: contentType,
  });

  const urlDeUpload = await getSignedUrl(clienteS3(), comando, {
    expiresIn: 300,
  });

  const urlPublica = `${urlPublicaBase.replace(/\/$/, "")}/${chave}`;

  return { urlDeUpload, urlPublica };
}
