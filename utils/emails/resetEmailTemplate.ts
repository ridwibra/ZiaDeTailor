export const resetEmailTemplate = (to: string, url: string): string => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
 <head>
  <meta charset="UTF-8">
  <meta content="width=device-width, initial-scale=1" name="viewport">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta content="telephone=no" name="format-detection">
  <title>New Message</title><!--[if (mso 16)]>
      <style type="text/css">
      a {text-decoration: none;}
      </style>
      <![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]>
  <noscript>
           <xml>
             <o:OfficeDocumentSettings>
             <o:AllowPNG></o:AllowPNG>
             <o:PixelsPerInch>96</o:PixelsPerInch>
             </o:OfficeDocumentSettings>
           </xml>
        </noscript>
  <![endif]--><!--[if mso]><xml>
      <w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word">
        <w:DontUseAdvancedTypographyReadingMail/>
      </w:WordDocument>
      </xml><![endif]-->
  <style type="text/css">
.rollover:hover .rollover-first {
    max-height:0px!important;
    display:none!important;
  }
  .rollover:hover .rollover-second {
    max-height:none!important;
    display:block!important;
  }
  .rollover span {
    font-size:0px;
  }
  u + .body img ~ div div {
    display:none;
  }
  #outlook a {
    padding:0;
  }
  span.MsoHyperlink,
  span.MsoHyperlinkFollowed {
    color:inherit;
    mso-style-priority:99;
  }
  a.n {
    mso-style-priority:100!important;
    text-decoration:none!important;
  }
  a[x-apple-data-detectors],
  #MessageViewBody a {
    color:inherit!important;
    text-decoration:none!important;
    font-size:inherit!important;
    font-family:inherit!important;
    font-weight:inherit!important;
    line-height:inherit!important;
  }
  .d {
    display:none;
    float:left;
    overflow:hidden;
    width:0;
    max-height:0;
    line-height:0;
    mso-hide:all;
  }
  @media only screen and (max-width:600px) {.bd { padding-right:0px!important } .bc { padding-left:0px!important }  *[class="gmail-fix"] { display:none!important } p, a { line-height:150%!important } h1, h1 a { line-height:120%!important } h2, h2 a { line-height:120%!important } h3, h3 a { line-height:120%!important } h4, h4 a { line-height:120%!important } h5, h5 a { line-height:120%!important } h6, h6 a { line-height:120%!important }  .z p { }   h1 { font-size:36px!important; text-align:left } h2 { font-size:26px!important; text-align:left } h3 { font-size:20px!important; text-align:left } h4 { font-size:24px!important; text-align:left } h5 { font-size:20px!important; text-align:left } h6 { font-size:16px!important; text-align:left }         .z p, .z a { font-size:14px!important }   .u, .u h1, .u h2, .u h3, .u h4, .u h5, .u h6 { text-align:center!important }     .t .rollover:hover .rollover-second, .u .rollover:hover .rollover-second, .v .rollover:hover .rollover-second { display:inline!important }   a.n, button.n { font-size:20px!important; padding:10px 20px 10px 20px!important; line-height:120%!important } a.n, button.n, .r { display:inline-block!important }    .g table, .h table, .i table, .g, .i, .h { width:100%!important; max-width:600px!important } .adapt-img { width:100%!important; height:auto!important }        .h-auto { height:auto!important } }
  @media screen and (max-width:384px) {.mail-message-content { width:414px!important } }
.es-p-default {
}
.es-p-default {
	padding-top:20px;
	padding-right:20px;
	padding-left:20px;
}
@media screen and (max-width:384px) {.mail-message-content { width:414px!important } }
</style>
 </head>
 <body class="body" style="width:100%;height:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
  <div dir="ltr" lang="en" class="es-wrapper-color" style="background-color:#FAFAFA"><!--[if gte mso 9]>
              <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                  <v:fill type="tile" color="#fafafa"></v:fill>
              </v:background>
          <![endif]-->
   <table width="100%" cellspacing="0" cellpadding="0" role="none" class="es-wrapper" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-color:#FAFAFA">
    <tbody>
     <tr>
      <td valign="top" style="padding:0;Margin:0">
       <table cellpadding="0" cellspacing="0" align="center" role="none" class="g" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important">
       </table>
       <table cellpadding="0" cellspacing="0" align="center" role="none" class="h" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important;background-color:transparent;background-repeat:repeat;background-position:center top">
       </table>
       <table cellpadding="0" cellspacing="0" align="center" role="none" class="g" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important">
        <tbody>
         <tr>
          <td align="center" style="padding:0;Margin:0">
           <table bgcolor="#ffffff" align="center" cellpadding="0" cellspacing="0" role="none" class="z" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
            <tbody>
             <tr>
              <td align="left" style="padding:15px 20px 0;Margin:0">
               <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                <tbody>
                 <tr>
                  <td align="center" valign="top" style="padding:0;Margin:0;width:560px">
                   <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                    <tbody>
                     <tr>
                      <td align="center" style="padding:10px 0;Margin:0;font-size:0px"><img src="https://eyykorc.stripocdn.email/content/guids/CABINET_7c0dbfad79cfa8f226fdca77b29004a57fc6368bdaac70adaac3c5662f9b6fa0/images/logo.jpeg" alt="" width="100" class="adapt-img" style="display:block;font-size:14px;border:0;outline:none;text-decoration:none"></td>
                     </tr>
                     <tr>
                      <td align="center" class="bd bc" style="Margin:0;padding:15px 40px"><h1 class="u" style="Margin:0;font-family:arial, 'helvetica neue', helvetica, sans-serif;mso-line-height-rule:exactly;letter-spacing:0;font-size:46px;font-style:normal;font-weight:bold;line-height:55.2px;color:#333333">Password reset&nbsp;</h1></td>
                     </tr>
                     <tr>
                      <td align="left" style="padding:10px 0 0;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">After you click the button, you'll be asked to complete the following steps:</p>
                       <ol style="font-family:arial, 'helvetica neue', helvetica, sans-serif;padding:0px 0px 0px 40px;margin-top:15px;margin-bottom:15px">
                        <li style="color:#333333;margin:0px 0px 15px;font-size:14px">Enter a new password.</li>
                        <li style="color:#333333;margin:0px 0px 15px;font-size:14px">Confirm your new password.</li>
                        <li style="color:#333333;margin:0px 0px 15px;font-size:14px">Click Submit.</li>
                       </ol></td>
                     </tr>
                    </tbody>
                   </table></td>
                 </tr>
                </tbody>
               </table></td>
             </tr>
             <tr>
              <td align="left" style="padding:0 20px 20px;Margin:0">
               <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                <tbody>
                 <tr>
                  <td align="center" valign="top" style="padding:0;Margin:0;width:560px">
                   <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;border-radius:5px">
                    <tbody>
                     <tr>
                      <td align="center" style="padding:10px 0;Margin:0"><span class="r" style="border-style:solid;border-color:#2CB543;background:#5C68E2;border-width:0px;display:inline-block;border-radius:6px;width:auto"><a href="${url}" target="_blank" class="es-button" style="mso-style-priority:100 !important;text-decoration:none !important;mso-line-height-rule:exactly;color:#FFFFFF;font-size:20px;padding:10px 30px;display:inline-block;background:#5C68E2;border-radius:6px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:normal;font-style:normal;line-height:24px;width:auto;text-align:center;letter-spacing:0;mso-padding-alt:0;mso-border-alt:10px solid #5C68E2;border-left-width:30px;border-right-width:30px">RESET YOUR PASSWORD </a></span></td>
                     </tr>
                     <tr>
                      <td align="center" style="padding:10px 0 0;Margin:0"><h3 class="u" style="Margin:0;font-family:arial, 'helvetica neue', helvetica, sans-serif;mso-line-height-rule:exactly;letter-spacing:0;font-size:20px;font-style:normal;font-weight:bold;line-height:30px;color:#333333">This link is valid for one use only. Expires in 3 hours.</h3></td>
                     </tr>
                     <tr>
                      <td align="center" style="padding:10px 0;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">If you didn't request to reset your&nbsp;password, please disregard this message.</p></td>
                     </tr>
                    </tbody>
                   </table></td>
                 </tr>
                </tbody>
               </table></td>
             </tr>
            </tbody>
           </table></td>
         </tr>
        </tbody>
       </table>
       <table cellpadding="0" cellspacing="0" align="center" role="none" class="i" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important;background-color:transparent;background-repeat:repeat;background-position:center top">
       </table>
       <table cellpadding="0" cellspacing="0" align="center" role="none" class="g" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important">
       </table></td>
     </tr>
    </tbody>
   </table>
  </div>
 </body>
</html>
    `;
};
