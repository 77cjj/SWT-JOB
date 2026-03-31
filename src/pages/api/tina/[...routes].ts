import type { NextApiRequest, NextApiResponse } from "next";
import {
  LocalBackendAuthProvider,
  TinaNodeBackend,
} from "@tinacms/datalayer";

import databaseClient from "../../../../tina/__generated__/databaseClient";

const handler = TinaNodeBackend({
  authProvider: LocalBackendAuthProvider(),
  databaseClient,
});

export default function tinaApiHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return handler(req, res);
}
