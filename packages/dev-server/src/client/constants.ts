/**
 * Client-side constants for dev server.
 */

export const DEV_SERVER_URL = '/~dev-server'
export const DEV_SERVER_INIT_URL = `${DEV_SERVER_URL}-init`
export const OPEN_IN_EDITOR_URL = `${DEV_SERVER_URL}-open-in-editor`

export const BUILD_LOG = 'devserver:buildlog'
export const BUILD_RESULTS = 'devserver:buildresults'
export const BUILD_STATUS = 'devserver:buildstatus'

export const NODE_TYPE_ELEMENT = 1
export const NODE_TYPE_DOCUMENT_FRAGMENT = 11

// WebSocket reconnection settings
export const RECONNECT_ATTEMPTS = 1000
export const RECONNECT_RETRY_MS = 2500
export const NORMAL_CLOSURE_CODE = 1000
export const REQUEST_BUILD_RESULTS_INTERVAL_MS = 500
