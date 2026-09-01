/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { i18nInstance } from "@plane/i18n";

export enum EFileError {
  INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
  FILE_SIZE_TOO_LARGE = "FILE_SIZE_TOO_LARGE",
  NO_FILE_SELECTED = "NO_FILE_SELECTED",
}

type TArgs = {
  acceptedMimeTypes: string[];
  file: File;
  maxFileSize: number;
  onError: (error: EFileError, message: string) => void;
};

export const isFileValid = (args: TArgs): boolean => {
  const { acceptedMimeTypes, file, maxFileSize, onError } = args;

  if (!file) {
    onError(
      EFileError.NO_FILE_SELECTED,
      String(i18nInstance.t("legacy_ui.no_file_selected_please_select_a_file_to_upload"))
    );
    return false;
  }

  if (!acceptedMimeTypes.includes(file.type)) {
    onError(EFileError.INVALID_FILE_TYPE, String(i18nInstance.t("file_upload.invalid_file_type")));
    return false;
  }

  if (file.size > maxFileSize) {
    onError(
      EFileError.FILE_SIZE_TOO_LARGE,
      String(
        i18nInstance.t("legacy_ui.file_size_too_large_please_select_a_file_smaller_than_value0_mb", {
          value0: maxFileSize / 1024 / 1024,
        })
      )
    );
    return false;
  }

  return true;
};
