import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable must be set");
}

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendInviteEmailParams {
  to: string;
  restaurantName: string;
  inviteLink: string;
  fromName?: string;
  fromEmail?: string;
}

export async function sendInviteEmail({
  to,
  restaurantName,
  inviteLink,
  fromName = "MenuIsland",
  fromEmail = "noreply@menuisland.it"
}: SendInviteEmailParams): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject: `Invito per gestire il menu di ${restaurantName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invito MenuIsland</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">MenuIsland</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Sistema di gestione menu digitali</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #4a5568; margin-top: 0;">Sei stato invitato a gestire il menu di <strong>${restaurantName}</strong></h2>
              
              <p style="font-size: 16px; margin-bottom: 25px;">
                Ciao! Sei stato invitato a gestire il menu digitale del ristorante <strong>${restaurantName}</strong> 
                attraverso la piattaforma MenuIsland.
              </p>
              
              <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #2d3748; margin-top: 0;">Cosa puoi fare:</h3>
                <ul style="color: #4a5568; padding-left: 20px;">
                  <li>Modificare il menu del ristorante</li>
                  <li>Aggiungere e rimuovere piatti</li>
                  <li>Gestire allergeni e ingredienti</li>
                  <li>Personalizzare l'aspetto del menu</li>
                  <li>Generare QR code per i clienti</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteLink}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 25px; 
                          font-weight: bold; 
                          font-size: 16px; 
                          display: inline-block;
                          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                  Accedi al Sistema
                </a>
              </div>
              
              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
                <p style="font-size: 14px; color: #718096; margin-bottom: 10px;">
                  Se non riesci a cliccare il pulsante, copia e incolla questo link nel tuo browser:
                </p>
                <p style="background: #f7fafc; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; word-break: break-all;">
                  ${inviteLink}
                </p>
              </div>
              
              <div style="margin-top: 30px; text-align: center; color: #718096; font-size: 14px;">
                <p>Questo invito è valido per 30 giorni.</p>
                <p>Se hai domande, contatta il supporto MenuIsland.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        Invito MenuIsland - Gestione Menu ${restaurantName}
        
        Ciao! Sei stato invitato a gestire il menu digitale del ristorante ${restaurantName}.
        
        Clicca su questo link per iniziare:
        ${inviteLink}
        
        Cosa puoi fare:
        - Modificare il menu del ristorante
        - Aggiungere e rimuovere piatti
        - Gestire allergeni e ingredienti
        - Personalizzare l'aspetto del menu
        - Generare QR code per i clienti
        
        Questo invito è valido per 30 giorni.
        
        MenuIsland Team
      `
    });

    if (error) {
      console.error('Resend email error:', error);
      return false;
    }

    console.log('Email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendAdminSupportEmail(to: string, subject: string, message: string, fromName: string = "MenuMaster Support"): Promise<boolean> {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Supporto MenuMaster</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white;">
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">MenuIsland</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Supporto Tecnico</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #4a5568; margin-top: 0;">${subject}</h2>
            
            <div style="font-size: 16px; line-height: 1.6; color: #2d3748; margin-bottom: 25px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #2d3748; margin-top: 0; font-size: 16px;">Informazioni di contatto:</h3>
              <p style="color: #4a5568; margin-bottom: 5px;"><strong>Email:</strong> support@menuisland.it</p>
              <p style="color: #4a5568; margin-bottom: 5px;"><strong>Telefono:</strong> +39 02 1234 5678</p>
              <p style="color: #4a5568; margin: 0;"><strong>Orari:</strong> Lun-Ven 9:00-18:00</p>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
              <p style="font-size: 14px; color: #718096; margin-bottom: 10px;">
                Questa email è stata inviata dal team di supporto di MenuIsland.
              </p>
              <p style="font-size: 12px; color: #a0aec0; margin: 0;">
                © 2024 MenuIsland. Tutti i diritti riservati.
              </p>
            </div>
          </div>
          
        </div>
      </body>
      </html>
    `;

    const msg = {
      to,
      from: 'noreply@menuisland.it',
      subject: `[MenuIsland Support] ${subject}`,
      html,
    };

    const { data, error } = await resend.emails.send(msg);
    
    if (error) {
      console.error('Resend email error:', error);
      return false;
    }
    console.log(`Support email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending support email:', error);
    return false;
  }
}

export async function sendWelcomeEmail(to: string, restaurantName: string, menuUrl: string): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: "MenuIsland <noreply@menuisland.it>",
      to: [to],
      subject: `Benvenuto in MenuIsland - ${restaurantName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Benvenuto in MenuIsland</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Benvenuto in MenuIsland!</h1>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #4a5568; margin-top: 0;">Il tuo menu digitale è pronto!</h2>
              
              <p style="font-size: 16px;">
                Congratulazioni! Hai completato la registrazione per <strong>${restaurantName}</strong>.
                Il tuo menu digitale è ora disponibile online.
              </p>
              
              <div style="background: #f0fff4; border: 1px solid #68d391; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #2f855a; margin-top: 0;">Il tuo menu è live:</h3>
                <p style="margin: 10px 0;">
                  <a href="${menuUrl}" style="color: #2f855a; font-weight: bold;">${menuUrl}</a>
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${menuUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 25px; 
                          font-weight: bold; 
                          font-size: 16px; 
                          display: inline-block;
                          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                  Visualizza il Menu
                </a>
              </div>
              
              <p style="color: #718096; font-size: 14px; text-align: center;">
                Condividi questo link con i tuoi clienti o genera un QR code dal pannello di controllo.
              </p>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend welcome email error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}