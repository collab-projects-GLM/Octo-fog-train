# Security Policy

## 1. Purpose

The security of this product, its source code, infrastructure, and users is a priority.

This policy describes how to report potential security vulnerabilities and how the maintainers handle security reports.

## 2. Supported Versions

Security fixes are prioritized for actively maintained versions.

| Version                    | Security Support       |
| -------------------------- | ---------------------- |
| Current production version | Supported              |
| Older versions             | Evaluated case by case |

Update this table to reflect the project's actual release policy.

## 3. Reporting a Vulnerability

Do not disclose security vulnerabilities through public issues, pull requests, discussions, or other public channels.

Report vulnerabilities through one of the following private channels:

- GitHub private vulnerability reporting, if enabled for this repository.
- Email: ayushyush100@gmail.com / ayushbarun69@gmail.com

Include the following information when possible:

- A description of the vulnerability.
- The affected component or version.
- Steps to reproduce the issue.
- Potential security impact.
- A proof of concept, if available and safe to provide.
- Suggested mitigation, if known.

Do not include real credentials, private keys, personal information, or customer data unless absolutely necessary and handled through an approved secure channel.

## 4. Expected Response

The maintainers will make reasonable efforts to:

1. Acknowledge the report within five business days.
2. Assess the severity and validity of the issue.
3. Investigate and develop an appropriate fix.
4. Coordinate remediation and any necessary disclosure.
5. Inform the reporter of the outcome where practical.

Resolution times may vary depending on severity, complexity, and available resources.

## 5. Responsible Testing

Security testing must only be performed on systems for which the tester has explicit authorization.

Do not:

- Access or modify another person's data without authorization.
- Disrupt production services.
- Exfiltrate confidential information.
- Attempt to access systems outside the approved testing scope.
- Publicly disclose an unpatched vulnerability before coordinating with the maintainers.

Testing third-party systems is not authorized by this policy.

## 6. Secrets and Credential Exposure

If a secret or credential is exposed:

- Notify the maintainers immediately through a private channel.
- Revoke or rotate the affected credential.
- Assess whether unauthorized access occurred.
- Remove the exposed secret from the repository history where appropriate.
- Review logs and take additional remediation steps as necessary.

Deleting a secret from the latest commit does not invalidate it. Rotate exposed credentials first.

## 7. Scope

This policy covers security issues affecting the product's source code, application, dependencies, deployment configuration, and infrastructure managed by the project.

## 8. Contact

Security contact: ayushyush100@gmail.com / ayushbarun69@gmail.com

Last updated: 2026-10-17
