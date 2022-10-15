package org.apache.camel.karavan.operator.spec;

import io.fabric8.kubernetes.api.model.Namespaced;
import io.fabric8.kubernetes.client.CustomResource;
import io.fabric8.kubernetes.model.annotation.*;
import org.apache.camel.karavan.operator.Constants;

@Group(Constants.CRD_GROUP)
@Version(Constants.CRD_VERSION)
@ShortNames(Constants.SHORT_NAME)
@Plural(Constants.PLURAL_NAME)
public class Karavan extends CustomResource<KaravanSpec, KaravanStatus> implements Namespaced {

}

