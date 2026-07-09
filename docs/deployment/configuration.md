# Runtime Configuration

Never commit production connection strings, signing material, or passwords. Override settings
with environment variables or the organization's secret manager:

```text
ConnectionStrings__ApplicationDatabase
ConnectionStrings__HrStaffDatabase
HcmLeaveApi__BaseUrl
HcmLeaveApi__ApiKey
Authentication__Authority
Authentication__Audience
Cors__AllowedOrigins__0
QuestPdf__License
```

The employee database connection uses the approved `HRStaff` SQL database only.
`HcmLeaveApi__BaseUrl` and `HcmLeaveApi__ApiKey` are optional external API
settings for leave particulars used in generated assessment PDFs. Set
`QuestPdf__License` only after the company has selected the license type
appropriate to its revenue and deployment.
