const LOGIN_PATH = "/login";
const HOME_PATH = "/home";

const stripPreviewToken = (pathname: string, search: string, hash: string) => {
  const params = new URLSearchParams(search);
  params.delete("__lovable_token");
  const nextSearch = params.toString();

  return `${pathname}${nextSearch ? `?${nextSearch}` : ""}${hash}`;
};

export const sanitizeRedirectTarget = (rawTarget?: string | null, fallback = HOME_PATH): string => {
  if (!rawTarget) return fallback;

  try {
    const url = new URL(rawTarget, window.location.origin);

    if (url.origin !== window.location.origin) {
      return fallback;
    }

    const nestedNext = url.searchParams.get("next");

    if (url.pathname === LOGIN_PATH && nestedNext) {
      return sanitizeRedirectTarget(nestedNext, fallback);
    }

    if (url.pathname === LOGIN_PATH) {
      return fallback;
    }

    return stripPreviewToken(url.pathname, url.search, url.hash) || fallback;
  } catch {
    return fallback;
  }
};

export const buildLoginRedirectTarget = (
  pathname = window.location.pathname,
  search = window.location.search,
  hash = window.location.hash,
): string => {
  const cleanTarget = sanitizeRedirectTarget(`${pathname}${search}${hash}`, HOME_PATH);

  if (!cleanTarget || cleanTarget === LOGIN_PATH || cleanTarget.startsWith(`${LOGIN_PATH}?`)) {
    return HOME_PATH;
  }

  return cleanTarget;
};