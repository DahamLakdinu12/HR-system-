# Runtime Configuration

Never commit production connection strings, signing material, or passwords. Override settings
with environment variables or the organization's secret manager:

```text
ConnectionStrings__ApplicationDatabase
ConnectionStrings__HcmDatabase
Authentication__Authority
Authentication__Audience
Cors__AllowedOrigins__0
QuestPdf__License
```

The HCM connection must use a dedicated account with access only to
`dbo.vw_HRIncrementEmployees`. Set `QuestPdf__License` only after the company has selected the
license type appropriate to its revenue and deployment.
