// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package filesstore

import (
	"io"
	"time"

	"github.com/pkg/errors"
)

const (
	DRIVER_S3    = "amazons3"
	DRIVER_LOCAL = "local"
)

type ReadCloseSeeker interface {
	io.ReadCloser
	io.Seeker
}

type FileBackend interface {
	TestConnection() error

	Reader(path string) (ReadCloseSeeker, error)
	ReadFile(path string) ([]byte, error)
	FileExists(path string) (bool, error)
	FileSize(path string) (int64, error)
	CopyFile(oldPath, newPath string) error
	MoveFile(oldPath, newPath string) error
	WriteFile(fr io.Reader, path string) (int64, error)
	AppendFile(fr io.Reader, path string) (int64, error)
	RemoveFile(path string) error
	FileModTime(path string) (time.Time, error)

	ListDirectory(path string) ([]string, error)
	RemoveDirectory(path string) error
}

type FileBackendSettings struct {
	DriverName              string
	Directory               string
	AmazonS3AccessKeyId     string
	AmazonS3SecretAccessKey string
	AmazonS3Bucket          string
	AmazonS3PathPrefix      string
	AmazonS3Region          string
	AmazonS3Endpoint        string
	AmazonS3SSL             bool
	AmazonS3SignV2          bool
	AmazonS3SSE             bool
	AmazonS3Trace           bool
}

func (settings *FileBackendSettings) CheckMandatoryS3Fields() error {
	if settings.AmazonS3Bucket == "" {
		return errors.New("missing s3 bucket settings")
	}

	// if S3 endpoint is not set call the set defaults to set that
	if settings.AmazonS3Endpoint == "" {
		settings.AmazonS3Endpoint = "s3.amazonaws.com"
	}

	return nil
}

func NewFileBackend(settings FileBackendSettings, enableComplianceFeatures bool) (FileBackend, error) {
	switch settings.DriverName {
	case DRIVER_S3:
		backend, err := NewS3FileBackend(settings, enableComplianceFeatures)
		if err != nil {
			return nil, errors.Wrap(err, "unable to connect to the s3 backend")
		}
		return backend, nil
	case DRIVER_LOCAL:
		return &LocalFileBackend{
			directory: settings.Directory,
		}, nil
	}
	return nil, errors.New("no valid filestorage driver found")
}
