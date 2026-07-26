export const activateEmailTemplate = (to: string, url: string): string => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
 <head>
  <meta charset="UTF-8">
  <meta content="width=device-width, initial-scale=1" name="viewport">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta content="telephone=no" name="format-detection">
  <title>Finishing signing up</title><!--[if (mso 16)]>
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
  <link href="https://fonts.googleapis.com/css2?family=Montserrat&display=swap" rel="stylesheet"><!--<![endif]--><!--[if mso]><xml>
    <w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word">
      <w:DontUseAdvancedTypographyReadingMail/>
    </w:WordDocument>
    </xml><![endif]-->
  <style type="text/css">
#outlook a {
	padding:0;
}
span.MsoHyperlink, span.MsoHyperlinkFollowed {
	color:inherit;
	mso-style-priority:99;
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
	font-family:Montserrat, sans-serif;
	padding:0px 0px 0px 40px;
	margin-top:15px;
	margin-bottom:15px;
}
ul li {
	color:rgb(51, 51, 51);
}
ol li {
	color:rgb(51, 51, 51);
}
li {
	margin:0px 0px 15px;
	font-size:16px;
}
li p {
	mso-margin-bottom-alt:15px;
}
.es-module-link {
	text-decoration:none;
}
.es-menu td a {
	font-family:Montserrat, sans-serif;
	font-weight:normal;
	text-decoration:none;
	display:block;
}
.es-header {
	background-color:transparent;
	background-repeat:repeat;
	background-position:center top;
}
.es-header-body {
	background-color:rgb(255, 255, 255);
}
.es-header-body p {
	color:rgb(51, 51, 51);
	font-size:14px;
}
.es-header-body a {
	color:rgb(19, 79, 92);
	font-size:14px;
	font-weight:inherit;
}
.es-footer {
	background-color:transparent;
	background-repeat:repeat;
	background-position:center top;
}
.es-footer-body {
	background-color:rgb(255, 255, 255);
}
.es-footer-body p {
	color:rgb(51, 51, 51);
	font-size:12px;
}
.es-footer-body a {
	color:rgb(19, 79, 92);
	font-size:12px;
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
h1 {
	font-size:70px;
	font-style:normal;
	font-weight:normal;
	line-height:120%;
	color:rgb(51, 51, 51);
}
h3 {
	font-size:20px;
	font-style:normal;
	font-weight:normal;
	line-height:120%;
	color:rgb(51, 51, 51);
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
	font-size:70px;
}
.es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a {
	font-size:36px;
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
@media only screen and (max-width:600px) {.es-m-p0r { padding-right:0px!important } .es-p-default { } *[class="gmail-fix"] { display:none!important } p, a { line-height:150%!important } h1, h1 a { line-height:120%!important } h2, h2 a { line-height:120%!important } h3, h3 a { line-height:120%!important } h4, h4 a { line-height:120%!important } h5, h5 a { line-height:120%!important } h6, h6 a { line-height:120%!important } h1 { font-size:42px!important; text-align:center; line-height:120% } h2 { font-size:26px!important; text-align:center; line-height:120% } h3 { font-size:20px!important; text-align:center; line-height:120% } h4 { font-size:24px!important; text-align:left } h5 { font-size:20px!important; text-align:left } h6 { font-size:16px!important; text-align:left } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:42px!important } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:26px!important } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important } .es-header-body h4 a, .es-content-body h4 a, .es-footer-body h4 a { font-size:24px!important } .es-header-body h5 a, .es-content-body h5 a, .es-footer-body h5 a { font-size:20px!important } .es-header-body h6 a, .es-content-body h6 a, .es-footer-body h6 a { font-size:16px!important } .es-header-body p, .es-header-body a { font-size:16px!important } .es-content-body p, .es-content-body a { font-size:16px!important } .es-footer-body p, .es-footer-body a { font-size:16px!important } .es-infoblock p, .es-infoblock a { font-size:12px!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3, .es-m-txt-c h4, .es-m-txt-c h5, .es-m-txt-c h6 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3, .es-m-txt-r h4, .es-m-txt-r h5, .es-m-txt-r h6 { text-align:right!important } .es-m-txt-j, .es-m-txt-j h1, .es-m-txt-j h2, .es-m-txt-j h3, .es-m-txt-j h4, .es-m-txt-j h5, .es-m-txt-j h6 { text-align:justify!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3, .es-m-txt-l h4, .es-m-txt-l h5, .es-m-txt-l h6 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-m-txt-r .es-menu td { float:right!important } .es-m-txt-l .es-menu td { float:left!important } .es-m-txt-c .es-menu td { display:inline-block } .es-spacer { display:inline-table } a.es-button, button.es-button { display:block!important; font-size:16px!important; padding:10px 30px 10px 30px!important; line-height:120%!important } .es-button-border { display:block!important } .es-m-fw, .es-m-fw.es-fw, .es-m-fw .es-button { display:block!important } .es-m-il, .es-m-il .es-button, .es-social, .es-social td, .es-menu.es-table-not-adapt { display:inline-block!important } .es-adaptive table, .es-left, .es-right { width:100%!important; border-collapse:separate!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .adapt-img { width:100%!important; height:auto!important } .es-adapt-td { display:block!important; width:100%!important } .es-mobile-hidden, .es-hidden { display:none!important } .es-container-hidden { display:none!important } .es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-hidden { display:table-cell!important } td.es-desk-menu-hidden { display:table-cell!important } .es-m-txt-c .es-menu td.es-desk-menu-hidden { display:inline-block!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table, .es-m-txt-r .es-menu td, .es-m-txt-l .es-menu td, .es-m-txt-c .es-menu td { width:auto!important } .h-auto { height:auto!important } a.es-button, button.es-button, label.es-button { border-bottom-width:15px!important; border-top-width:15px!important } }
@media screen and (max-width:384px) {.mail-message-content { width:414px!important } }
</style>
 </head>
 <body class="body" style="width:100%;height:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
  <div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#FFFFFF"><!--[if gte mso 9]>
			<v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
				<v:fill type="tile" color="#ffffff"></v:fill>
			</v:background>
		<![endif]-->
   <table width="100%" cellspacing="0" cellpadding="0" class="es-wrapper" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top">
    <tbody>
     <tr>
      <td valign="top" style="padding:0;Margin:0">
       <table cellpadding="0" cellspacing="0" align="center" class="es-content" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important">
        <tbody>
         <tr>
          <td align="center" style="padding:0;Margin:0">
           <table bgcolor="#ffffff" align="center" cellpadding="0" cellspacing="0" class="es-content-body" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:700px">
            <tbody>
             <tr>
              <td align="left" style="Margin:0;padding:40px 20px 20px">
               <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                <tbody>
                 <tr>
                  <td align="center" valign="top" style="padding:0;Margin:0;width:660px">
                   <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                    <tbody>
                     <tr>
                      <td align="center" height="52" class="h-auto" style="padding:20px;Margin:0;font-size:0px"><img src="https://eyykorc.stripocdn.email/content/guids/CABINET_7474ff2049b5094543666ef4c32c359d090c25603e018c18355a6b35a6e91de5/images/image.jpeg" alt="" width="100" class="adapt-img" style="display:block;font-size:16px;border:0;outline:none;text-decoration:none;margin:0"></td>
                     </tr>
                     <tr>
                      <td align="center" style="padding:0;Margin:0"><h2 style="Margin:0;font-family:Montserrat, sans-serif;mso-line-height-rule:exactly;letter-spacing:0;font-size:36px;font-style:normal;font-weight:normal;line-height:43px;color:#333333">Verify your email ZiaDeTailor</h2></td>
                     </tr>
                     <tr>
                      <td align="center" class="es-m-txt-c" style="padding:10px 0;Margin:0;font-size:0">
                       <table border="0" width="40%" height="100%" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:40% !important;display:inline-table" role="presentation">
                        <tbody>
                         <tr>
                          <td style="padding:0;Margin:0;border-bottom:1px solid #cccccc;background:none;height:0px;width:100%;margin:0px"></td>
                         </tr>
                        </tbody>
                       </table></td>
                     </tr>
                     <tr>
                      <td align="center" class="es-m-p0r" style="padding:5px 40px 5px 0;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:Montserrat, sans-serif;line-height:24px;letter-spacing:0;font-weight:normal;color:#333333;font-size:16px">Thank you for registering on&nbsp; <a href=${url} target="_blank" style="mso-line-height-rule:exactly;text-decoration:underline;color:#134F5C;font-size:16px;font-weight:inherit">ziadetailor.com</a>.</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:Montserrat, sans-serif;line-height:24px;letter-spacing:0;font-weight:normal;color:#333333;font-size:16px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:Montserrat, sans-serif;line-height:24px;letter-spacing:0;font-weight:normal;color:#333333;font-size:16px">Please confirm that ${to} is your email address by clicking on the button below or use this link ${url} within <strong style="font-weight:bolder !important">48 hours</strong>.</p></td>
                     </tr>
                     <tr>
                      <td align="center" class="es-m-txt-c" style="padding:10px 0;Margin:0;font-size:0">
                       <table border="0" width="40%" height="100%" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:40% !important;display:inline-table" role="presentation">
                        <tbody>
                         <tr>
                          <td style="padding:0;Margin:0;border-bottom:1px solid #cccccc;background:none;height:0px;width:100%;margin:0px"></td>
                         </tr>
                        </tbody>
                       </table></td>
                     </tr>
                     <tr>
                      <td align="center" class="es-m-txt-l" style="padding:10px 0;Margin:0"><span class="es-button-border" style="border-style:solid;border-color:#999999;background:#ffffff;border-width:1px;display:inline-block;border-radius:0px;width:auto;text-align:center !important"><a href=${url} target="_blank" class="es-button" style="mso-style-priority:100 !important;text-decoration:none !important;mso-line-height-rule:exactly;color:#666666;font-size:16px;font-weight:normal;padding:10px 30px;display:inline-block;background:#ffffff;border-radius:0px;font-family:Montserrat, sans-serif;font-style:normal;line-height:19px;width:auto;text-align:center;letter-spacing:0;mso-padding-alt:0;text-transform:none;border-color:#ffffff">Verify my email</a></span></td>
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
       </table></td>
     </tr>
    </tbody>
   </table>
  </div>
 </body>
</html>`;
};
