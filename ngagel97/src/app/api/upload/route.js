import { NextResponse } from "next/server";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 🔧 Revisi: Hindari experimental buffer.File
    const stream = file.stream();
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const key = `${uuidv4()}-${file.name}`;

    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    };

    await s3.send(new PutObjectCommand(uploadParams));

    const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return NextResponse.json({
      url,
      pathname: `/${key}`,
      key,
      uploadedAt: new Date().toISOString(),
      size: buffer.length,
      contentType: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    console.log("Upload error:", error);
    return NextResponse.json(
      { error: "File upload failed", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const key = decodeURIComponent(searchParams.get("key"));

  if (!key) {
    return NextResponse.json({ error: "No key provided" }, { status: 400 });
  }

  try {
    const deleteParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    };

    await s3.send(new DeleteObjectCommand(deleteParams));

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    console.log("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to delete file", details: error.message },
      { status: 500 }
    );
  }
}
