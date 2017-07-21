###
format begins with 54 43 46 31
  TCF1
  then 4 bytes containing the hwid (0c000000, 04000000, etc)

then key value pairs separated by nulls

format ends with two nulls
  first null normal line end
  second null signifies EOF
###

fs   = require 'fs'
zlib = require 'zlib'
isGzip = require 'is-gzip'
buffertools = require 'buffertools'
NvramArm = require "./nvram-arm-parser"


class NvramParser
  # pretty-print JSON?
  @pretty: false

  @error: (e) -> console.error "error: #{e}"

  @formatHexString: (hexstring) -> hexstring.toLowerCase().replace /\s/g, ""

  # define format
  @header: "54 43 46 31"
  @footer: "00 00"
  @headerbuf: buffertools.fromHex new Buffer @formatHexString @header
  @footerbuf: buffertools.fromHex new Buffer @formatHexString @footer
  @separator: "\u0000"
  @hwid_keyname: "_nvramcfg_saved_hwid_hex"

  # validate that buffer is bookended by header/footer
  @validate: (buf) ->
    return "object not a Buffer" unless buf instanceof Buffer

    unless buffertools.equals (h = buf[0..@headerbuf.length-1]), @headerbuf
      return "header \"#{h}\" does not match expected NVRAM cfg format -- aborting"

    unless buffertools.equals (f = buf[-@footerbuf.length..]), @footerbuf
      return "footer \"#{f}\" does not match expected NVRAM cfg format -- aborting"

    true

  # (async) load file and return unzipped buffer
  @loadFile: (filename, autocb) ->
    file = fs.readFileSync filename

    if isGzip file
      await zlib.gunzip file, defer err, buf
      err = valid unless (valid = @validate buf) is true
    else if NvramArm.is file
      await NvramArm.decode file, defer buf
    else
      err = "unrecognized filetype"

    return @error err if err
    buf

  # parse buffer
  @parse: (buf) =>
    body = buf[@headerbuf.length..-@footerbuf.length]
    bound = 0
    settings = {}

    # extract the hwid
    if body.length < 4
      return @error "body too small"
    settings[@hwid_keyname] = buffertools.toHex body[..3]
    body = body[4..]

    # loop through each null character
    while body.length
      bound = buffertools.indexOf body, @separator, 0

      # slice pair and remaining body from each side of null char
      if bound > -1
        pair = body[..bound-1]
        body = body[bound+1..]
      else
        return @error "format not supported, missing null terminator"

      # slice pair at first index of "=" ("=" is valid char in value after "=")
      pair = pair.toString "utf8"
      eq   = pair.indexOf "="
      key  = pair[..eq-1]
      if key is @hwid_keyname then continue
      val  = pair[eq+1..]
      settings[key] = val

    settings

  # (async) load file and return JSON string of key/value pairs
  @decode: (filename, autocb) =>
    await @loadFile filename, defer buf
    settings = @parse buf
    if @pretty then JSON.stringify settings, null, 2
    else            JSON.stringify settings

  @encode: (filename, format = "original", autocb) =>
    json = fs.readFileSync filename
    settings = JSON.parse json
    hwid_hex = null

    # create buffer from key:value pairs and append null char
    pairs = for key, value of settings
      if key is @hwid_keyname
        hwid_hex = value
        continue
      pair = new Buffer "#{key}=#{value}"
      buffertools.concat pair, @separator

    if hwid_hex and hwid_hex.length isnt 8
      return @error "saved hardware id invalid format"

    # strip null character from last line or tomato complains "Extra data found at the end."
    last = pairs[pairs.length-1]
    pairs[pairs.length-1] = last[..-@separator.length]

    switch format.toLowerCase()
      when "original"
        await @encodeOriginal pairs, hwid_hex, defer encoded
      when "arm"
        await NvramArm.encode pairs, defer encoded
      else
        return @error "format not supported"

    encoded

  # (async) load JSON file and pack in Tomato NVRAM cfg binary format
  @encodeOriginal: (pairs, hwid_hex, autocb) =>
    # if there's no hwid_hex then use the default from older nvramcfg
    if not hwid_hex then hwid_hex = "0c000000"
    hwid_buf = buffertools.fromHex new Buffer hwid_hex
    # bookend key=value pairs with header/footer
    buf = buffertools.concat @headerbuf, hwid_buf, pairs..., @footerbuf
    await zlib.gzip buf, defer err, fz
    return @error err if err
    fz


module.exports = NvramParser
