export const mutedListEntryUser = `{{username}}#{{discriminator}}
  ## Muted: {{dateFormatted}}
  ## Reason: {{reason}}
  ## Muted By: {{mutedBy}}

` // Extra space above is expected for formatting

export const mutedListEntryUserLeftServer = `{{username}}#{{discriminator}} __(user left the server)__
  ## Muted: {{dateFormatted}}
  ## Reason: {{reason}}
  ## Muted By: {{mutedBy}}

` // Extra space above is expected for formatting
