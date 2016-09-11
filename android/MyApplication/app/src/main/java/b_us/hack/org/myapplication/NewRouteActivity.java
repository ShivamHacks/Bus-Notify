package b_us.hack.org.myapplication;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * A demo class that stores and retrieves data objects with each marker.
 */
public class NewRouteActivity extends Activity {
    private static final String URL ="http://bus-notify.herokuapp.com/createNewRoute" ;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        final WebView webView=new WebView(this);
        webView.setWebViewClient(new WebViewClient(){
            @Override
            public boolean shouldOverrideUrlLoading(WebView webview, String url){
                webView.loadUrl(url);
                return true;
            }
        });
        setContentView(webView);
        webView.loadUrl(URL);
    }
}