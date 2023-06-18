export function isImage(str: string) {
  return /(https?\:\/\/[\w.\/\-\%]*\.(png|jpeg|jpg|gif|tiff|svg))$/i.test(str)
}
