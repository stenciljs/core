/**
 * Build status and favicon utilities for dev server client.
 */

import { onBuildLog, onBuildStatus } from './events.js'

// =============================================================================
// Favicon Icons (Base64 encoded)
// =============================================================================

const ICON_DEFAULT =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAMAAABlApw1AAAAnFBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4jUzeAAAAM3RSTlMAsGDs4wML8QEbBvr2FMhAM7+ILCUPnNzXrX04otO6j3RiT0ggzLSTcmtWUUWoZlknghZc2mZzAAACrklEQVR42u3dWXLiUAyFYWEwg40x8wxhSIAwJtH+99ZVeeinfriXVpWk5Hyr+C2VrgkAAAAAAAAAAAw5sZQ7aUhYypw07FjKC2ko2yxk2SQFgwYLOWSkYFhlIZ06KWhNWMhqRApGKxYyaZGCeoeFVIekIDuwkEaXFDSXLKRdkoYjS9mRhjlLSUjDO0s5kYYzS+mThn3OQsYqAbQQC7hZSgoGYgHUy0jBa42FvKkEUDERC6CCFIzeWEjtlRRkPbGAG5CCtCIWQAtS0ByzkHxPGvos5UEaNizlnTRsWconhbM4wTpSFHMTrFtKCroNFrLGBOsJLbGAWxWkoFiJBRAmWE/I1r4nWOmNheTeJ1gX0vDJUrYUweAEa04aHs5XePvc9wpPboJ1SCmOsRVkr04aromUEQEAgB9lxaZ++ATFpNDv6Y8qm1QdBk9QTAr9ni6mbFK7DJ6g2LQLXoHZlFCQdMY2nYJXYDb1g1dgNo2boSswm2Zp6ArMptCFyIVtCl2IlDmbNC0QcPEQcD8l4HLvAXdxHnBb5wG3QcDFQ8D9mIDrIeCiIeDiA25oNeA+EHDREHDxAbdmmxBwT0HARQbciW0KDbiEbQoNuB3bFBxwbTYJAfcUBFxkwFG/YlNJAADgxzCRcqUY9m7KGgNSUEx9H3XXO76Puv/OY5wedX/flHk+6j46v2maO79purPvm6Yz+75puua+b5q6Dd/PEsrNMyZfFM5gAMW+ymPtWciYV3ksBpBOwKUH3wHXXLKUM2l4cR5wG+cBlzgPuJ3zgJNb6FRwlP4Ln1X8wrOKeFbxP6Qz3wEn+KzilWLYe5UnMuDwY5BvD+cBt899B9zC+49Bqr4DrlXzHXDF1HfA1Tu+Ay5b+w649OY74OjoO+Bo7jzg7s4DDgAAAAAAAAAA/u0POrfnVIaqz/QAAAAASUVORK5CYII='
const ICON_PENDING =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAMAAABlApw1AAAAjVBMVEUAAAD8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjL8kjLn7xn3AAAALnRSTlMAsFBgAaDxfPpAdTMcD/fs47kDBhVXJQpvLNbInIiBRvSqIb+TZ2OOONxdzUxpgKSpAAAAA69JREFUeNrt3FtvskAQxvERFQXFioqnCkqth572+3+8947dN00TliF5ZpP53ZOAveg/OzCklFJKKaWUUkoppQTZm77cCGFo+jIhhG/TlwchJAvTk/GIAA6x6Um+JoDti+nJ644A5h+mJ8eMALKj6cnHnAB2r80NLJ4jf3Vz+cuWANZ5cwPTM/l7by6PZwQwGptGQf4q++dLCOHdNIbkb2IvjwjAvYEf8pe6j4/wYxopr/9SQih4BXa3l5eEcJ7a++c9/gkSQE8bcCWvXwcrAjjYADrxHv8KCbi3JasgD5fm8i9IAG1swMXzDv0X2wDaEED21dzA5UDeVoPm8uUbAayvvAI42YA7EIDzA5pv8lc6/UoAoxMv4CZuvyKUpnHn9VNBAG6B7XkBtCeEO6/AbvbyihAiXsB92svfCcA9wap4j19DAmgWs37AZCrnBKvu8vgX9AmWE3BZh/6L7QkWJIA2RxtwHQpml9sAQp9gXWbkbxz4CdYDfIK1qk1j3IV9fPgJFlNECJXhYfSfsBHkhBCKwEd452nYI7wncwQJP8GKTU+uO0I4D/uSkVJKqXAkA5nK9icoIi3nrU9QRHrZtj5BESmetT5BEantPCh7NTJFrUdgMg1bj8BkSv1HYJ8RmjMQKf1HYDdC+/R/IyQFzbD4AxH+CIyPPxCJoEdQ/IFIMgXNEPkDkd8jMLQs5wRcTXA1J+By/BGO+0ovYwQGU3kPRLJfIzCkCSfgpgmhpc5AxD/gIkLb8wKO0DTgoNyaGQQecNfQAy7TgGtHA04DLtyA24UecHngAVdrwIkJuAitU8DJ1Dbghkam9gEnU+uAWxiRjhsdoXagI1TPgKNyIBO+ZpRSSrW3HfblTAA9/juPDwTAfiMK9VG3PY/hwX7Ubc9j+AoCWNWGp+NSH4HflE2IgXUEGPI3TTfmN4ndv2kSsRUJvpUn4W1FShbYb5rc84ySAtzKs3W3IgW4lWfO24q0zsFbebIjaysSjbtt5RHzUf0DHHCrAW8gVYEDzl0LGYW4lefB24uYQgOOfwN7dMANeW/k3DkBJ2CrUNE54GRsFYIHnPNR+iPEgHPWKo5DDDhnrWKeBRhwzlrFeNtlq5CgtYqzAAPODaBzgAH331rFAAOOqsDXKjL3IqboN7ILJ4BCDDh3r3SIAfd0AijEgHP3So/8wQNuvjRBbxVij5A6Bpy8EZJnwIkbIfkFnLwRkm/ASRshXbwDTtYICRRwt7BHqEoppZRSSimllFLqD/8AOXJZHefotiIAAAAASUVORK5CYII='
const ICON_ERROR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAMAAABlApw1AAAAkFBMVEUAAAD5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0H5Q0HYvLBZAAAAL3RSTlMAsGDjA/rsC/ElHRUBBssz9pFCvoh0UEcsD9ec3K19OLiiaNLEYlmoVeiCbmE+GuMl4I8AAAKQSURBVHja7d1njupQDIZhAimEUIZQQu9taN7/7q50pfl/TmTJtvQ9q3hzLDsEAAAAAAAAAACGzFjKiTS0WcqONMxZypg0fH5YyLFPChZdFnIYkILil4VcclLw3bCQ85KULM8sZPMlBfmFhfwWpGBwYCHdESnoH1nIz4c0jFnKnDTsWEqbNJxYyow03FjKlDTUKQtZqwTQXizgtgkpWGQsZKIScL0OCxmqBFC5EQugkhQshyyk0yMFgwkLyRakIGmJBdCeFPTXLCStScOUpdwogsEXrBdpuLKUJ4XDC9afKmUh94QUjLy/YGViAZRTOIMBtypJQXn2HUC5WMBleMFqILmzkLSicBZfsB6k4clSrqTh5XyEd3MeQHXqe4Qn94LVSiicwRHkJScNdVvKkgAAwI+qZdM0/AXFpE4v+AXFpKwIfkExKfR7ulyxSWkV/IJi0zx4BGbTm4IkW7ZpFjwCs2kaPAKzad0PHYHZtE1CR2A2TQahIzCbhnnwCMykVYmAi4aAQ8BZ4T3grgi4BhBwCDgbEHCNIOAQcCYg4BpCwCHgLEDAaYgPuDfbhIBrBAGHgDMhNOBo2rKpIgAA8KNoS6kplq2dsu6CFJQr30vd+dD3Uvf/nTLHS93J3flZwrHznaad852mE/veaXqw752mKvW90zTq+j5LWGS+r/J8xQKoU1AUa2chm1zlsXQWUifgkoPvgOsffQccjZ0H3Mx5wL2dB9zcecB9sJTePOBM3cU+46wiziq6C7hk6zvg3J9VfDK7vir0ch5wN+cBV6e+A27v/ccgme+AkxshTXKKYW6EFH0X29gIKTLgzI2QYgPO2ggpLuDsvaDEBZy9EVJcwBkcIT0IAAAAAAAAAADs+AdjeyF69/r87QAAAABJRU5ErkJggg=='
const ICON_DISABLED =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAMAAABlApw1AAAAeFBMVEUAAAC4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7+4t7/uGGySAAAAJ3RSTlMAsGAE7OMcAQvxJRX69kHWyL8zq5GIdEcsD5zcfVg4uKLNa1JPZoK/xdPIAAACiklEQVR42u3dW5KqUAyF4QgCCggqIt7t9pb5z/Ccvjz2w95UqpJ0r28Uf2WTQAAAAAAAAAAAYMiWpTxJQ8JSTqThwVI2pKFZsJC3ghTs5izkmpKCcspCljNSkB9ZSLsnBfuWhRxzUjBbspBpSQrSKwuZr0lB8cZCFg1p2LCUB2k4sZSENNxYypY0nFlKTxqGmoUcClJwEQu4SUoKdmIBtEpJQZ6xkHeVAKqOYgFUkYL9OwvJclKQrsQCbkcK0olYAF1IQXFgIfVAGnqWcqZwFidYN4phb4L1onCYYMlPsLqUFKwxwRozwTIYcG1FCqrWdwBhgqU7wUo7FlJ7n2DdScPL+RPezfkT3tl5AA217yc89xMssYBbzUjDkEjZEwAA+NFMbOrDJygmZXnwBMWkaRk8QTFpvg6eoJi0aIInKDY9gp/AbEqCJyg2bYOfwGzqKUzPNh2K0Ccwm0IfRBK2KfSLkDvbFPog0tRsUlsh4EZAwP2SgKu9B9wdATcOAg4BZwACbgQEHALOCATcCAg4BJwVCLhREHB/LOAebFNwwC3YJATcKAi4yICjfmJTQwAA4EeZSBkojrWdsvmO4hjbKYtd6ra2Uxa71G1tp0xnqbvo+IPfpe4Nf3K703Ridr3T9OQPfnea7szseaepqX3vNH3NM/xe5fmeZ7i9yiMXQFlJEeydhYy4ymMygCICzmQAxQactbOQMQFnMoBiAs7iVaHIgDN3VSgq4AxeFYoOOGNXhbCUPkaJs4o4q/iXzyp2vgPO/VnFl/OAu/F/jq8KnZ0H3FD7DriL9x+DTH0HXJ75Driq9R1ws6XvgEuvvgOu6HwHHG18BxydnAfc03nAAQAAAAAAAADAz/4BoL2Us9XM2zMAAAAASUVORK5CYII='
const ICON_TYPE = 'image/x-icon'

// =============================================================================
// Build Status
// =============================================================================

export const initBuildStatus = (data: { window: Window }): void => {
  const win = data.window
  const doc = win.document
  const iconElms = getFavIcons(doc)

  iconElms.forEach((iconElm) => {
    if (iconElm.href) {
      iconElm.dataset.href = iconElm.href
      iconElm.dataset.type = iconElm.type
    }
  })

  onBuildStatus(win, (buildStatus) => {
    updateBuildStatus(doc, buildStatus)
  })
}

const updateBuildStatus = (doc: Document, status: string): void => {
  const iconElms = getFavIcons(doc)
  iconElms.forEach((iconElm) => {
    updateFavIcon(iconElm, status)
  })
}

export const updateFavIcon = (linkElm: HTMLLinkElement, status: string): void => {
  if (status === 'pending') {
    linkElm.href = ICON_PENDING
    linkElm.type = ICON_TYPE
    linkElm.setAttribute('data-status', status)
  } else if (status === 'error') {
    linkElm.href = ICON_ERROR
    linkElm.type = ICON_TYPE
    linkElm.setAttribute('data-status', status)
  } else if (status === 'disabled') {
    linkElm.href = ICON_DISABLED
    linkElm.type = ICON_TYPE
    linkElm.setAttribute('data-status', status)
  } else {
    linkElm.removeAttribute('data-status')
    if (linkElm.dataset.href) {
      linkElm.href = linkElm.dataset.href
      linkElm.type = linkElm.dataset.type || ICON_TYPE
    } else {
      linkElm.href = ICON_DEFAULT
      linkElm.type = ICON_TYPE
    }
  }
}

const getFavIcons = (doc: Document): HTMLLinkElement[] => {
  const iconElms: HTMLLinkElement[] = []
  const linkElms = doc.querySelectorAll('link')

  for (let i = 0; i < linkElms.length; i++) {
    if (
      linkElms[i].href &&
      linkElms[i].rel &&
      (linkElms[i].rel.indexOf('shortcut') > -1 || linkElms[i].rel.indexOf('icon') > -1)
    ) {
      iconElms.push(linkElms[i])
    }
  }

  if (iconElms.length === 0) {
    const linkElm = doc.createElement('link')
    linkElm.rel = 'shortcut icon'
    doc.head.appendChild(linkElm)
    iconElms.push(linkElm)
  }

  return iconElms
}

// =============================================================================
// Build Progress
// =============================================================================

export const initBuildProgress = (data: { window: Window }): void => {
  const win = data.window

  onBuildLog(win, (buildLog) => {
    if (buildLog.progress < 1) {
      // Could add progress bar UI here
    }
  })
}
