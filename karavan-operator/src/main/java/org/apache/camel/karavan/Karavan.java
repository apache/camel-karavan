package org.apache.camel.karavan;

import io.fabric8.kubernetes.api.model.Namespaced;
import io.fabric8.kubernetes.client.CustomResource;
import io.fabric8.kubernetes.model.annotation.*;

@Group(Constants.CRD_GROUP)
@Version(Constants.CRD_VERSION)
@ShortNames(Constants.SHORT_NAME)
@Plural(Constants.PLURAL_NAME)
public class Karavan extends CustomResource<KaravanSpec, KaravanStatus> implements Namespaced {}

