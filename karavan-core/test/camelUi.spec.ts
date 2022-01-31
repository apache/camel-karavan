// /*
//  * Licensed to the Apache Software Foundation (ASF) under one or more
//  * contributor license agreements.  See the NOTICE file distributed with
//  * this work for additional information regarding copyright ownership.
//  * The ASF licenses this file to You under the Apache License, Version 2.0
//  * (the "License"); you may not use this file except in compliance with
//  * the License.  You may obtain a copy of the License at
//  *
//  *      http://www.apache.org/licenses/LICENSE-2.0
//  *
//  * Unless required by applicable law or agreed to in writing, software
//  * distributed under the License is distributed on an "AS IS" BASIS,
//  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  * See the License for the specific language governing permissions and
//  * limitations under the License.
//  */
// import {expect} from 'chai';
// import 'mocha';
// import {
//     FromDefinition,
// } from "../src/core/model/CamelDefinition";
//
// describe('CamelUi', () => {
//
//     it('getSelectorLabels 1', () => {
//
//         const undef = CamelUi.getSelectorModelsForParent(undefined);
//         expect(undef.length).to.equal(0);
//
//         const from = CamelUi.getSelectorModelsForParent("FromDefinition");
//         expect(from.length).to.equal(29);
//
//         const filter = CamelUi.getSelectorModelsForParent("FilterDefinition");
//         expect(filter.length).to.equal(29);
//
//         const choice = CamelUi.getSelectorModelsForParent("ChoiceDefinition", false);
//         expect(choice.length).to.equal(2);
//
//         const tryd = CamelUi.getSelectorModelsForParent("TryDefinition", false);
//         expect(tryd.length).to.equal(2);
//
//         const catchd = CamelUi.getSelectorModelsForParent("CatchDefinition", false);
//         expect(catchd.length).to.equal(1);
//
//         const labelsF = CamelUi.getSelectorModelLabels("FromDefinition");
//     });
//
// });