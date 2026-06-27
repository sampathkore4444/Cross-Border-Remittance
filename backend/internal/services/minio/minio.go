package minio

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type Service struct {
	client *minio.Client
	bucket string
}

func New(endpoint, accessKey, secretKey, bucket string) (*Service, error) {
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: false,
	})
	if err != nil {
		return nil, fmt.Errorf("minio client: %w", err)
	}

	ctx := context.Background()
	exists, err := client.BucketExists(ctx, bucket)
	if err != nil {
		return nil, fmt.Errorf("bucket check: %w", err)
	}
	if !exists {
		err = client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{})
		if err != nil {
			return nil, fmt.Errorf("create bucket: %w", err)
		}
	}

	return &Service{client: client, bucket: bucket}, nil
}

func (s *Service) UploadKYC(ctx context.Context, userID, docType string, data []byte) (string, error) {
	path := fmt.Sprintf("kyc/%s/%s/%d_%s", userID, docType, time.Now().Unix(), "document.jpg")
	_, err := s.client.PutObject(ctx, s.bucket, path,
		bytes.NewReader(data), int64(len(data)),
		minio.PutObjectOptions{ContentType: "image/jpeg"},
	)
	if err != nil {
		return "", fmt.Errorf("upload kyc: %w", err)
	}
	return path, nil
}

func (s *Service) UploadReceipt(ctx context.Context, txRef string, data []byte) (string, error) {
	path := fmt.Sprintf("receipts/%s/%s.pdf", txRef[:8], txRef)
	_, err := s.client.PutObject(ctx, s.bucket, path,
		bytes.NewReader(data), int64(len(data)),
		minio.PutObjectOptions{ContentType: "application/pdf"},
	)
	if err != nil {
		return "", fmt.Errorf("upload receipt: %w", err)
	}
	return path, nil
}

func (s *Service) GetPresignedURL(ctx context.Context, path string, expiry time.Duration) (string, error) {
	url, err := s.client.PresignedGetObject(ctx, s.bucket, path, expiry, nil)
	if err != nil {
		return "", fmt.Errorf("presigned url: %w", err)
	}
	return url.String(), nil
}

func (s *Service) GetObject(ctx context.Context, path string) (io.ReadCloser, error) {
	obj, err := s.client.GetObject(ctx, s.bucket, path, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("get object: %w", err)
	}
	return obj, nil
}

func (s *Service) DeleteObject(ctx context.Context, path string) error {
	err := s.client.RemoveObject(ctx, s.bucket, path, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("delete object: %w", err)
	}
	return nil
}
