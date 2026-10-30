# Security Policy

## Reporting a vulnerability

Please **do not** report security vulnerabilities through public GitHub issues.

Instead, report them privately using one of these channels:

- **GitHub Security Advisories** (preferred):
  https://github.com/pandusudo/quran-discipline/security/advisories/new
- **Email**: <!-- Maintainer: replace with a contact address --> `[CONTACT EMAIL HERE]`

Please include:

- A description of the issue and its impact
- Steps to reproduce, or a proof of concept if available
- Affected versions/commits if you know them

You should receive an acknowledgement within a few days. Please allow a
reasonable window for investigation and a fix before any public disclosure.

## Scope

In scope:

- The extension code in this repository
- Weaknesses in blocking enforcement (e.g. ways to bypass blocks that defeat
  the extension's stated purpose)
- Privacy issues: data leaking beyond what [PRIVACY.md](PRIVACY.md) describes

Out of scope:

- The companion dashboard service at `quran.pandusudo.xyz` (report those to
  its operator instead)
- Vulnerabilities in third-party hosts lists that this project merely bundles
- Social-engineering of the user (e.g. talking someone into disabling the
  extension)
