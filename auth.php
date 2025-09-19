<?php
define('AUTH_SALT',        '}.vVJS`R`aM-c,r.~:k]e`2URJrhV<Bzt_bF v@},*E-akQpu|^Q9MXlc{~2[{o^');
  // Impostazione dell'header per indicare che stiamo restituendo JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');


// Leggi l'indirizzo email dalla richiesta POST
$jsonData = json_decode(file_get_contents('php://input'), true);
$email = $jsonData['email'];
$code = $jsonData['code'] ?? false;
 
// Controllo validità indirizzo
function isEmailValid($email){
    $pattern = '/^[a-z]{6,}@lscortese\.com$/';
   
    if (preg_match($pattern, $email,$matches, PREG_OFFSET_CAPTURE)) {
       return true;
    } else {
        return false;
    }
   
}

function generateCode($email) {
    $hash = md5($email.AUTH_SALT);
    $numeric = hexdec(substr($hash, 0, 8));
    return str_pad($numeric % 1000000, 6, '0', STR_PAD_LEFT);
}

// Funzione per inviare una risposta JSON
function sendJsonResponse($success, $message, $verified = false) {
    //header('Content-Type: application/json');
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}

// Controlla se l'email è valida
if (isEmailValid($email)) {
   
    // Se è stato ricevuto un codice di verifica
    if($code){
        
        if($code == generateCode($email)){
            session_start();
            $_SESSION['email'] = $email;
            sendJsonResponse(true, "Email verificata", true);
        } else {
            sendJsonResponse(true, "Codice di verifica errato", false);
        }
    } else {
        // genera codice Email
        $code = generateCode($email);
        // Invia l'email con il codice
        $to = $email;
        $subject = "Codice di verifca WAY Cortese";
        $message = "Il tuo codice di verifica è: $code";
        $headers = "From: WAY Cortese <noreply.waycortese@lscortese.com>\r\n";
        
        if (mail($to, $subject, $message, $headers)) {
            sendJsonResponse(true, "Codice inviato con successo. Controlla la tua casella email $email. Troverai una mail con oggetto \"$subject\" contenente il codice di verifica.");
        } else {
            sendJsonResponse(false, "Errore nell'invio dell'email");
        }
    }
    
} else {
    sendJsonResponse(false, "Indirizzo email non autorizzato.");
}
?>