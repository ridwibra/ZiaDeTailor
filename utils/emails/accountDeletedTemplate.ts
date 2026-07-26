export const accountDeletedTemplate = (
  name: string = "Valued User",
  email: string = ""
) => {
  return `
   <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
 <head>
  <meta charset="UTF-8">
  <meta content="width=device-width, initial-scale=1" name="viewport">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta content="telephone=no" name="format-detection">
  <title>We hate goodbyes</title><!--[if (mso 16)]>
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
<![endif]--><!--[if !mso]><!-- -->
  <link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i" rel="stylesheet"><!--<![endif]--><!--[if mso]><xml>
    <w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word">
      <w:DontUseAdvancedTypographyReadingMail/>
    </w:WordDocument>
    </xml><![endif]-->
  <style type="text/css">#outlook a {
	padding:0;
}
span.MsoHyperlink, span.MsoHyperlinkFollowed {
	color:inherit;
	mso-style-priority:99;
}
a.es-button {
	mso-style-priority:100!important;
	text-decoration:none!important;
}
a[x-apple-data-detectors], #MessageViewBody a {
	color:inherit!important;
	text-decoration:none!important;
	font-size:inherit!important;
	font-family:inherit!important;
	font-weight:inherit!important;
	line-height:inherit!important;
}
.es-desk-hidden {
	display:none;
	float:left;
	overflow:hidden;
	width:0;
	max-height:0;
	line-height:0;
	mso-hide:all;
}
.es-left {
	float:left;
}
.es-right {
	float:right;
}
.es-menu td {
	border:0;
}
.es-menu div {
	vertical-align:middle;
	display:block;
}
.es-menu td a img {
	display:inline!important;
	vertical-align:middle;
}
sub, sup {
	display:inline-block;
	font-size:75%!important;
	line-height:1!important;
}
sub {
	vertical-align:bottom;
	mso-text-raise:-30%;
}
sup {
	mso-text-raise:30%;
	vertical-align:top;
}
s {
	text-decoration:line-through;
}
ul, ol {
	font-family:lato, "helvetica neue", helvetica, arial, sans-serif;
	padding:0px 0px 0px 40px;
	margin-top:15px;
	margin-bottom:15px;
}
ul li {
	color:rgb(255, 255, 255);
}
ol li {
	color:rgb(255, 255, 255);
}
li {
	margin:0px 0px 15px;
	font-size:18px;
}
li p {
	mso-margin-bottom-alt:15px;
}
.es-module-link {
	text-decoration:none;
}
.es-menu td a {
	font-family:lato, "helvetica neue", helvetica, arial, sans-serif;
	font-weight:normal;
	text-decoration:none;
	display:block;
}
.es-header-body p {
	color:rgb(255, 255, 255);
	font-size:16px;
}
.es-footer {
	background-color:transparent;
	background-repeat:repeat;
	background-position:center top;
}
.es-footer-body {
	background-color:rgb(255, 238, 200);
}
.es-footer-body p {
	color:rgb(51, 51, 51);
	font-size:14px;
}
.es-footer-body a {
	color:rgb(61, 133, 198);
	font-size:14px;
	font-weight:inherit;
}
.es-infoblock p {
	font-size:12px;
	color:rgb(204, 204, 204);
}
.es-infoblock a {
	font-size:12px;
	color:rgb(204, 204, 204);
	font-weight:inherit;
}
h2 {
	font-size:24px;
	font-style:normal;
	font-weight:bold;
	line-height:120%;
	color:rgb(253, 217, 134);
}
h3 {
	font-size:20px;
	font-style:normal;
	font-weight:normal;
	line-height:120%;
	color:rgb(253, 217, 134);
}
h4 {
	font-size:24px;
	font-style:normal;
	font-weight:normal;
	line-height:120%;
	color:rgb(51, 51, 51);
}
h5 {
	font-size:20px;
	font-style:normal;
	font-weight:normal;
	line-height:120%;
	color:rgb(51, 51, 51);
}
h6 {
	font-size:16px;
	font-style:normal;
	font-weight:normal;
	line-height:120%;
	color:rgb(51, 51, 51);
}
.es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a {
	font-size:30px;
}
.es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a {
	font-size:24px;
}
.es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a {
	font-size:20px;
}
.es-header-body h4 a, .es-content-body h4 a, .es-footer-body h4 a {
	font-size:24px;
}
.es-header-body h5 a, .es-content-body h5 a, .es-footer-body h5 a {
	font-size:20px;
}
.es-header-body h6 a, .es-content-body h6 a, .es-footer-body h6 a {
	font-size:16px;
}
a.es-button, button.es-button, label.es-button {
	padding:10px 20px 10px 20px;
	display:inline-block;
	background:rgb(38, 38, 38);
	border-radius:5px 5px 5px 5px;
	font-size:18px;
	font-family:arial, "helvetica neue", helvetica, sans-serif;
	font-weight:bold;
	font-style:normal;
	line-height:120%;
	color:rgb(253, 217, 134);
	text-decoration:none!important;
	width:auto;
	text-align:center;
	letter-spacing:0;
	mso-padding-alt:0;
	mso-border-alt:10px solid rgb(49, 203, 75);
	text-transform:none;
}
.es-button-border {
	border-style:solid;
	border-color:rgb(253, 217, 134) rgb(253, 217, 134) rgb(253, 217, 134) rgb(253, 217, 134);
	background:rgb(38, 38, 38);
	border-width:2px 2px 2px 2px;
	display:inline-block;
	border-radius:5px 5px 5px 5px;
	width:auto;
}
.es-button img {
	display:inline-block;
	vertical-align:middle;
}
button.es-button, .es-fw button.es-button {
	width:100%;
}
.es-fw, .es-fw .es-button {
	display:block;
}
.es-il, .es-il .es-button {
	display:inline-block;
}
.es-text-rtl h1, .es-text-rtl h2, .es-text-rtl h3, .es-text-rtl h4, .es-text-rtl h5, .es-text-rtl h6, .es-text-rtl input, .es-text-rtl label, .es-text-rtl textarea, .es-text-rtl p, .es-text-rtl ol, .es-text-rtl ul, .es-text-rtl .es-menu a, .es-text-rtl .es-table {
	direction:rtl;
}
.es-text-ltr h1, .es-text-ltr h2, .es-text-ltr h3, .es-text-ltr h4, .es-text-ltr h5, .es-text-ltr h6, .es-text-ltr input, .es-text-ltr label, .es-text-ltr textarea, .es-text-ltr p, .es-text-ltr ol, .es-text-ltr ul, .es-text-ltr .es-menu a, .es-text-ltr .es-table {
	direction:ltr;
}
.es-text-rtl ol, .es-text-rtl ul {
	padding:0px 40px 0px 0px;
}
.es-text-ltr ul, .es-text-ltr ol {
	padding:0px 0px 0px 40px;
}
.es-p-default {
	padding-top:20px;
	padding-right:20px;
	padding-left:20px;
}
@media only screen and (max-width:600px) {.es-p-default { } *[class="gmail-fix"] { display:none!important } p, a { line-height:150%!important } h1, h1 a { line-height:120%!important } h2, h2 a { line-height:120%!important } h3, h3 a { line-height:120%!important } h4, h4 a { line-height:120%!important } h5, h5 a { line-height:120%!important } h6, h6 a { line-height:120%!important } h1 { font-size:45px!important; text-align:center } h2 { font-size:26px!important; text-align:center } h3 { font-size:20px!important; text-align:center } h4 { font-size:24px!important; text-align:left } h5 { font-size:20px!important; text-align:left } h6 { font-size:16px!important; text-align:left } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:45px!important } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:26px!important } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important } .es-header-body h4 a, .es-content-body h4 a, .es-footer-body h4 a { font-size:24px!important } .es-header-body h5 a, .es-content-body h5 a, .es-footer-body h5 a { font-size:20px!important } .es-header-body h6 a, .es-content-body h6 a, .es-footer-body h6 a { font-size:16px!important } .es-header-body p, .es-header-body a { font-size:16px!important } .es-content-body p, .es-content-body a { font-size:16px!important } .es-footer-body p, .es-footer-body a { font-size:14px!important } .es-infoblock p, .es-infoblock a { font-size:12px!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3, .es-m-txt-c h4, .es-m-txt-c h5, .es-m-txt-c h6 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3, .es-m-txt-r h4, .es-m-txt-r h5, .es-m-txt-r h6 { text-align:right!important } .es-m-txt-j, .es-m-txt-j h1, .es-m-txt-j h2, .es-m-txt-j h3, .es-m-txt-j h4, .es-m-txt-j h5, .es-m-txt-j h6 { text-align:justify!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3, .es-m-txt-l h4, .es-m-txt-l h5, .es-m-txt-l h6 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-m-txt-r .es-menu td { float:right!important } .es-m-txt-l .es-menu td { float:left!important } .es-m-txt-c .es-menu td { display:inline-block } .es-spacer { display:inline-table } a.es-button, button.es-button { display:inline-block!important; font-size:20px!important; padding:10px 20px 10px 20px!important; line-height:120%!important } .es-button-border { display:inline-block!important } .es-m-fw, .es-m-fw.es-fw, .es-m-fw .es-button { display:block!important } .es-m-il, .es-m-il .es-button, .es-social, .es-social td, .es-menu.es-table-not-adapt { display:inline-block!important } .es-adaptive table, .es-left, .es-right { width:100%!important; border-collapse:separate!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .adapt-img { width:100%!important; height:auto!important } .es-adapt-td { display:block!important; width:100%!important } .es-mobile-hidden, .es-hidden { display:none!important } .es-container-hidden { display:none!important } .es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-hidden { display:table-cell!important } td.es-desk-menu-hidden { display:table-cell!important } .es-m-txt-c .es-menu td.es-desk-menu-hidden { display:inline-block!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table, .es-m-txt-r .es-menu td, .es-m-txt-l .es-menu td, .es-m-txt-c .es-menu td { width:auto!important } .h-auto { height:auto!important } .es-m-text .es-text-mobile-size-26, .es-m-text .es-text-mobile-size-26 * { font-size:26px!important } }
@media screen and (max-width:384px) {.mail-message-content { width:414px!important } }</style>
 </head>
 <body class="body" style="width:100%;height:100%;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
  <div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#FFEEC8"><!--[if gte mso 9]>
			<v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
				<v:fill type="tile" color="#FFEEC8"></v:fill>
			</v:background>
		<![endif]-->
   <table width="100%" cellspacing="0" cellpadding="0" class="es-wrapper" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top">
    <tbody>
     <tr style="border-collapse:collapse">
      <td valign="top" style="padding:0;Margin:0">
       <table cellpadding="0" cellspacing="0" align="center" class="es-header" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important;background-color:transparent;background-repeat:repeat;background-position:center top">
        <tbody>
         <tr style="border-collapse:collapse">
          <td align="center" style="padding:0;Margin:0">
           <table bgcolor="#ffffff" align="center" cellpadding="0" cellspacing="0" class="es-header-body" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#333333;width:600px">
            <tbody>
             <tr style="border-collapse:collapse">
              <td align="left" style="padding:20px 20px 0;Margin:0">
               <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                <tbody>
                 <tr style="border-collapse:collapse">
                  <td align="center" valign="top" style="padding:0;Margin:0;width:560px">
                   <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                    <tbody>
                     <tr style="border-collapse:collapse">
                      <td align="center" style="padding:10px 0;Margin:0;font-size:0px"><a target="_blank" href="https://viewstripo.email" style="mso-line-height-rule:exactly;text-decoration:underline;color:#1376C8;font-size:16px;font-weight:inherit"><img src="https://eyykorc.stripocdn.email/content/guids/CABINET_04296563d2251b701ec159f67595b6c43899b3191df4b05987763d402427df91/images/logo.jpeg" alt="Yummy" width="173" title="Yummy" class="adapt-img" style="display:block;font-size:18px;border:0;outline:none;text-decoration:none;margin:0"></a></td>
                     </tr>
                    </tbody>
                   </table></td>
                 </tr>
                </tbody>
               </table></td>
             </tr>
             <tr style="border-collapse:collapse">
             </tr>
            </tbody>
           </table></td>
         </tr>
        </tbody>
       </table>
       <table cellspacing="0" cellpadding="0" align="center" class="es-content" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important">
        <tbody>
         <tr style="border-collapse:collapse">
          <td align="center" style="padding:0;Margin:0">
           <table cellspacing="0" cellpadding="0" bgcolor="#333333" align="center" class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#333333;width:600px" role="none">
            <tbody>
             <tr style="border-collapse:collapse">
              <td align="left" bgcolor="#333333" style="padding:20px 20px 0;Margin:0;background-color:#333333">
               <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                <tbody>
                 <tr style="border-collapse:collapse">
                  <td align="center" valign="top" style="padding:0;Margin:0;width:560px">
                   <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                    <tbody>
                     <tr style="border-collapse:collapse">
                      <td align="left" class="es-m-text" style="padding:10px 0;Margin:0"><h1 class="es-text-mobile-size-26" style="Margin:0;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;mso-line-height-rule:exactly;letter-spacing:0;font-size:26px;font-style:normal;font-weight:normal;line-height:31px;color:#FDD986;text-align:center"><strong style="font-weight:bolder !important">WE HATE GOODBYES </strong>😭</h1></td>
                     </tr>
                    </tbody>
                   </table></td>
                 </tr>
                </tbody>
               </table></td>
             </tr>
             <tr style="border-collapse:collapse">
              <td align="left" style="padding:20px 20px 0;Margin:0">
               <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                <tbody>
                 <tr style="border-collapse:collapse">
                  <td align="center" valign="top" style="padding:0;Margin:0;width:560px">
                   <table cellpadding="0" cellspacing="0" width="100%" bgcolor="#262626" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;background-color:#262626;border-radius:5px" role="presentation">
                    <tbody>
                     <tr style="border-collapse:collapse">
                      <td align="left" style="padding:20px;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;letter-spacing:0;font-weight:normal;color:#FFFFFF;font-size:16px">Hello <strong style="font-weight:bolder !important">${name}</strong>,</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;letter-spacing:0;font-weight:normal;color:#FFFFFF;font-size:16px">This message is regarding your email: <strong style="font-weight:bolder !important">${email}</strong>.</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:27px;letter-spacing:0;font-weight:normal;color:#FFFFFF;font-size:16px">Your unverified account on&nbsp; <a target="_blank" href="https://vercel.com/ridwibras-projects/~/domains/ziadetailor.com" style="mso-line-height-rule:exactly;text-decoration:underline;color:#3D85C6;font-size:18px;font-weight:inherit">ziadetailor.com</a> &nbsp;has been deleted because the email address was not verified within the required 48-hour window.<br><br>This means your email address is now available for a new registration.</p></td>
                     </tr>
                    </tbody>
                   </table></td>
                 </tr>
                </tbody>
               </table></td>
             </tr>
             <tr style="border-collapse:collapse">
              <td align="left" style="padding:20px 20px 0;Margin:0">
               <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                <tbody>
                 <tr style="border-collapse:collapse">
                  <td align="center" valign="top" style="padding:0;Margin:0;width:560px">
                   <table cellpadding="0" cellspacing="0" width="100%" bgcolor="#262626" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;background-color:#262626;border-radius:5px" role="presentation">
                    <tbody>
                     <tr style="border-collapse:collapse">
                      <td align="left" style="padding:20px;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;letter-spacing:0;font-weight:normal;color:#FFFFFF;font-size:16px">If you still wish to join us, please feel free to sign up again at your convenience. Just remember to verify your email through the link we send you shortly after registration.</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;letter-spacing:0;font-weight:normal;color:#FFFFFF;font-size:16px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:27px;letter-spacing:0;font-weight:normal;color:#FFFFFF;font-size:16px">Best regards,<br> <a target="_blank" href="https://vercel.com/ridwibras-projects/~/domains/ziadetailor.com" style="mso-line-height-rule:exactly;text-decoration:underline;color:#3D85C6;font-size:18px;font-weight:inherit">ziadetailor.com</a></p></td>
                     </tr>
                    </tbody>
                   </table></td>
                 </tr>
                </tbody>
               </table></td>
             </tr>
             <tr style="border-collapse:collapse">
             </tr>
             <tr style="border-collapse:collapse">
             </tr>
             <tr style="border-collapse:collapse">
             </tr>
             <tr style="border-collapse:collapse">
             </tr>
            </tbody>
           </table></td>
         </tr>
        </tbody>
       </table></td>
     </tr>
    </tbody>
   </table>
  </div>
 </body>
</html>
  `;
};
